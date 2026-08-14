import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.staticfiles',
    'corsheaders',
    'planner',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'core.urls'
WSGI_APPLICATION = 'core.wsgi.application'
CORS_ALLOW_ALL_ORIGINS = True
USE_TZ = True
STATIC_URL = 'static/'