from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Employee
from .serializers import EmployeeSerializer

class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(is_deleted=False)

class EmployeeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Employee.objects.all()

    def perform_destroy(self, instance):
        instance.soft_delete()

# List deleted employees
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def deleted_employees(request):
    employees = Employee.objects.filter(is_deleted=True)
    serializer = EmployeeSerializer(employees, many=True)
    return Response(serializer.data)

# Restore a deleted employee
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def restore_employee(request, pk):
    try:
        emp = Employee.objects.get(pk=pk, is_deleted=True)
    except Employee.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)
    emp.restore()
    return Response({'message': 'Employee restored'}, status=200) 