from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Settings
from .serializers import SettingsSerializer

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def settings_view(request):
    settings_obj, created = Settings.objects.get_or_create(id=1)
    if request.method == 'GET':
        serializer = SettingsSerializer(settings_obj)
        return Response({"success": True, "message": "Settings fetched successfully.", "data": serializer.data})
    elif request.method == 'PUT':
        serializer = SettingsSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Settings updated successfully.", "data": serializer.data})
        return Response({"success": False, "message": "Settings update failed.", "data": serializer.errors}, status=400) 