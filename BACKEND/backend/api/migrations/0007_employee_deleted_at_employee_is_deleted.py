# Generated by Django 5.2.4 on 2025-07-17 10:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_employee_bankaccount_cashentry'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='employee',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
    ]
