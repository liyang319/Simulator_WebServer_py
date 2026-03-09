# simulator_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import publish_mqtt

# API 路由（使用 DRF 路由器）
router = DefaultRouter()
router.register(r'cabinets', views.CabinetViewSet)
router.register(r'masters', views.MasterViewSet)
router.register(r'slaves', views.SlaveViewSet)
router.register(r'modules', views.ModuleViewSet)
router.register(r'signals', views.SignalViewSet)
router.register(r'projects', views.ProjectViewSet)

urlpatterns = [
    # API 前缀
    path('api/', include(router.urls)),

    # 前端页面（根路径）
    path('management/', views.management_view, name='management'),
    path('api/publish-mqtt/', publish_mqtt, name='publish_mqtt'),
]