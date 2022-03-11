INSERT INTO departments (name)
VALUES
    ('Accounting'),
    ('Sales'),
    ('Warehouse');

INSERT INTO roles (title, salary, departments_id)
VALUES 
    ('Lead Accountant', 80000.00, 1),
    ('Accountant', 60000.00, 1),
    ('Head of Sales', 75000., 2),
    ('Sales Rep', 45000.00, 2),
    ('Warehouse Lead', 50000.00, 3),
    ('Warehouse Worker', 30000.00, 3);

INSERT INTO employees (first_name, last_name, roles_id, manager_id)
VALUES 
    ('Sam', 'Smith', 3, NULL),
    ('Kyle', 'Briar', 4, 3),
    ('Chris', 'Man', 5, NULL),
    ('Kevin', 'Buckey', 6, 5),
    ('Amy', 'Sinclair', 2, 1),
    ('Austin', 'Ingles', 1, NULL);