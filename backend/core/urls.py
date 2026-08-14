from django.http import JsonResponse
from django.urls import path, include


def root_status(_request):
    return JsonResponse({"status": "ok", "message": "Backend is running"})

urlpatterns = [
    path('', root_status),
    path('api/', include('planner.urls')),
]
