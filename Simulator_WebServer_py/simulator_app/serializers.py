# simulator_app/serializers.py
from rest_framework import serializers
from .models import Cabinet, Master, Slave, Module, Signal, Project

class CabinetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cabinet
        fields = '__all__'

class MasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Master
        fields = '__all__'

class SlaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slave
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'

class SignalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signal
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    signals = serializers.PrimaryKeyRelatedField(many=True, queryset=Signal.objects.all())
    class Meta:
        model = Project
        fields = '__all__'