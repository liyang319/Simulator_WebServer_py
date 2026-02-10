from django.shortcuts import render

from django.shortcuts import render


def management_view(request):
    return render(request, 'simulator_app/management.html')
