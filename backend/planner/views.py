import json
import math
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

AVG_MPH = 55  # fallback average speed if OSRM gives odd data


def geocode(place):
    r = requests.get(
        'https://nominatim.openstreetmap.org/search',
        params={'q': place, 'format': 'json', 'limit': 1},
        headers={'User-Agent': 'eld-trip-planner'},
        timeout=10,
    )
    data = r.json()
    if not data:
        raise ValueError(f'Location not found: {place}')
    return float(data[0]['lat']), float(data[0]['lon'])


def route(a, b):
    url = f'http://router.project-osrm.org/route/v1/driving/{a[1]},{a[0]};{b[1]},{b[0]}'
    r = requests.get(url, params={'overview': 'full', 'geometries': 'geojson'}, timeout=15)
    leg = r.json()['routes'][0]
    miles = leg['distance'] / 1609.34
    hours = leg['duration'] / 3600
    return miles, hours, leg['geometry']['coordinates']


def build_activities(dist1, dur1, dist2, dur2):
    """Split each driving leg into <=1000mi chunks (fueling stop between chunks),
    and add 1hr on-duty for pickup and dropoff."""
    def split(dist, dur):
        speed = dist / dur if dur else AVG_MPH
        acts, remaining = [], dist
        while remaining > 0:
            leg = min(remaining, 1000)
            acts.append(('drive', leg / speed))
            remaining -= leg
            if remaining > 0:
                acts.append(('onduty', 0.5))  # fueling stop
        return acts

    return split(dist1, dur1) + [('onduty', 1.0)] + split(dist2, dur2) + [('onduty', 1.0)]


def simulate(activities, cycle_used):
    """Walks through activities applying 70/8, 11hr driving, 14hr window,
    8hr->30min break, and 10hr/34hr resets. Returns list of (status, start, end)."""
    t = elapsed = drive_win = drive_break = 0.0
    cycle = cycle_used
    segs = []

    def add(status, hours):
        nonlocal t
        if hours > 1e-6:
            segs.append((status, t, t + hours))
            t += hours

    for kind, hours in activities:
        remaining = hours
        while remaining > 1e-6:
            if kind == 'drive':
                cap = min(remaining, 8 - drive_break, 11 - drive_win, 14 - elapsed, 70 - cycle)
            else:
                cap = min(remaining, 14 - elapsed, 70 - cycle)

            if cap > 1e-6:
                add('driving' if kind == 'drive' else 'onduty', cap)
                elapsed += cap
                cycle += cap
                remaining -= cap
                if kind == 'drive':
                    drive_win += cap
                    drive_break += cap
                else:
                    drive_break = 0  # a real on-duty stop also counts as a break from driving
            else:
                if 70 - cycle <= 1e-6:
                    add('offduty', 34)  # 34hr restart of the 70/8 cycle
                    cycle = elapsed = drive_win = drive_break = 0
                elif 14 - elapsed <= 1e-6 or (kind == 'drive' and 11 - drive_win <= 1e-6):
                    add('offduty', 10)  # daily reset
                    elapsed = drive_win = drive_break = 0
                else:
                    add('offduty', 0.5)  # mandatory 30-min break
                    elapsed += 0.5
                    drive_break = 0
    return segs, t


def to_days(segs, total_hours):
    """Splits elapsed-time segments into 24hr calendar days for the log grid."""
    days = max(math.ceil(total_hours / 24), 1)
    out = [[] for _ in range(days)]
    for status, s, e in segs:
        d = int(s // 24)
        while s < e and d < days:
            day_end = (d + 1) * 24
            seg_end = min(e, day_end)
            out[d].append({'status': status, 'start': round(s - d * 24, 2), 'end': round(seg_end - d * 24, 2)})
            s = seg_end
            d += 1
    return out


@csrf_exempt
def plan_trip(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        body = json.loads(request.body)
        cur, pick, drop = body['current'], body['pickup'], body['dropoff']
        cycle_used = float(body.get('cycle_used', 0) or 0)

        p_cur, p_pick, p_drop = geocode(cur), geocode(pick), geocode(drop)
        dist1, dur1, geo1 = route(p_cur, p_pick)
        dist2, dur2, geo2 = route(p_pick, p_drop)

        activities = build_activities(dist1, dur1, dist2, dur2)
        segs, total_hours = simulate(activities, cycle_used)
        logs = to_days(segs, total_hours)

        return JsonResponse({
            'distance_miles': round(dist1 + dist2, 1),
            'total_hours': round(total_hours, 1),
            'route': geo1 + geo2,
            'markers': {'current': p_cur, 'pickup': p_pick, 'dropoff': p_drop},
            'logs': logs,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
