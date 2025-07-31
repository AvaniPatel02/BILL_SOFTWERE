from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Employee, EmployeeActionHistory
from .serializers import EmployeeSerializer, EmployeeActionHistorySerializer
from django.utils import timezone

# Utility to log employee actions
def log_employee_action(employee, action, details=""):
    print(f"[DEBUG] Logging action: {action} for employee {employee.id} - {employee.name}")
    EmployeeActionHistory.objects.create(
        employee=employee,
        action=action,
        details=details
    )
    print(f"[DEBUG] Action logged: {action}")

class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Employee.objects.filter(is_deleted=False)

    def perform_create(self, serializer):
        employee = serializer.save()
        log_employee_action(employee, "Created", "Employee created.")

class EmployeeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Employee.objects.all()

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_data = {
            'name': old_instance.name,
            'email': old_instance.email,
            'joining_date': old_instance.joining_date,
            'salary': old_instance.salary,
            'number': old_instance.number,
        }
        employee = serializer.save()
        changed_fields = []
        for field in old_data:
            if getattr(employee, field) != old_data[field]:
                changed_fields.append(field)
        if 'salary' in serializer.validated_data and serializer.validated_data['salary'] != old_data['salary']:
            if serializer.validated_data['salary'] > old_data['salary']:
                log_employee_action(employee, f"Incremented salary from {old_data['salary']} to {employee.salary}", "Salary incremented")
            else:
                # Salary decreased or corrected, treat as edit
                other_fields = [f for f in changed_fields if f != 'salary']
                log_employee_action(employee, f"Edited: salary{', ' + ', '.join(other_fields) if other_fields else ''}", f"Fields changed: salary{', ' + ', '.join(other_fields) if other_fields else ''}")
        elif changed_fields:
            log_employee_action(employee, f"Edited: {', '.join(changed_fields)}", f"Fields changed: {', '.join(changed_fields)}")
        else:
            log_employee_action(employee, "Edited", "Employee details updated.")

    def perform_destroy(self, instance):
        print(f"[DEBUG] perform_destroy called for employee {instance.id} - {instance.name}")
        instance.soft_delete()
        log_employee_action(instance, "Deleted", "Employee soft-deleted.")
        print(f"[DEBUG] perform_destroy completed for employee {instance.id}")

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
    log_employee_action(emp, "Restored", "Employee restored from deleted.")
    return Response({'message': 'Employee restored'}, status=200)

# Permanent delete endpoint
@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def permanent_delete_employee(request, pk):
    try:
        emp = Employee.objects.get(pk=pk, is_deleted=True)
    except Employee.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)
    emp.delete()
    return Response({'message': 'Employee permanently deleted'}, status=204)

# Fetch action history for an employee
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def employee_action_history(request, pk):
    try:
        employee = Employee.objects.get(pk=pk)
    except Employee.DoesNotExist:
        return Response({'message': 'Not found'}, status=404)
    actions = EmployeeActionHistory.objects.filter(employee=employee).order_by('-date')
    serializer = EmployeeActionHistorySerializer(actions, many=True)
    return Response(serializer.data) 