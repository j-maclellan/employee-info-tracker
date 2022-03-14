const express = require('express');
const apiRoutes = require('./routes/apiRoutes');
const inquirer = require('inquirer');


// Imports
const db = require('./db/connection');
const res = require('express/lib/response');
const { use } = require('./routes/apiRoutes');



const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/api', apiRoutes);


// Default response for any other request (Not found)
app.use((req, res) => {
    res.status(404).end();
});
const userPrompt = () => {
    inquirer.prompt([
        {
            name: 'action',
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View all Departments', 'View all Roles', 'View all Employees', 
                      'Add a Department', 'Add a Role', 'Add an Employee', 'Update an Employee Role',
                     'Update Manager', 'View Employees by Manager', 'View Employees by Department', 
                     'Delete Department', 'Delete Role', 'Delete Employee', 'View total Department budget']
        }
    ])
    .then((answers) => {
        const {action} = answers;

            if (action === 'View all Departments') {
                viewAllDepartments();
            }
            if (action === 'View all Roles') {
                viewAllRoles();
            }
            if (action === 'View all Employees') {
                viewAllEmployees();
            }
            if (action  === 'Add an Employee') {
                addEmployee();
            }
            if (action === 'Add a Role') {
                addRole();
            }
            if (action === 'Add a Department') {
                addDepartment();
            }
            if (action === 'Update an Employee Role') {
                updateEmployee();
            }
            if (action === 'Delete Department') {
                deleteDepartment();
            }
            if (action === 'Delete Role') {
                deleteRole();
            }
            if (action === 'Delete Employee') {
                deleteEmployee();
            }
            if (action === 'Update Manager') {
                updateManager();
            }
            if (action === 'View Employees by Department') {
                byDepartment();
            }
            if (action === 'View Employees by Manager') {
                byManager();
            }
            if (action === 'View total Department budget') {
                totalBudget();
            }
    });
};
// View Departments
const viewAllDepartments = () => {
    const sql = `SELECT * FROM departments`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        console.table(response);

        userPrompt();
    });
};
// View all Roles
const viewAllRoles = () => {
    const sql = `SELECT roles.*, departments.name
                 AS department_name
                 FROM roles LEFT JOIN departments
                 ON roles.department_id = departments.id`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        console.table(response);

        userPrompt();
    });
};
// View all Employees
const viewAllEmployees = () => {
    const sql = `SELECT employees.*, roles.title AS role_title, roles.salary AS role_salary,
                 departments.name AS department
                 FROM employees 
                 LEFT JOIN roles ON employees.role_id = roles.id
                 LEFT JOIN departments ON roles.department_id = departments.id`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        console.table(response);
        userPrompt();
    });
};
// Add an Employee
const addEmployee = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'firstName',
            message: "What is the employee's first name?",
            validate: firstName => {
                if (!firstName) {
                    console.log('PLease enter a first name');
                    return false;
                } else {
                    return true;
                }
            }
        },
        {
            type: 'input',
            name: 'lastName',
            message: "What is the employee's last name?",
            validate: lastName => {
                if (!lastName) {
                    console.log('Please enter a last name');
                    return false;
                } else {
                    return true;
                }
            }
        }
    ])
    .then(answers => {
        const params = [answers.firstName, answers.lastName]
        const roleSql = `SELECT roles.id, roles.title FROM roles`;
        db.query(roleSql, (err, response) => {
            if (err) throw error;
            const roles = response.map(({ id, title }) => ({ name: title, value: id }));
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'role',
                    message: "What is the employee's role?",
                    choices: roles
                }
            ])
            .then(employeeRole => {
                const role = employeeRole.role;
                params.push(role);
                const managerSql = `SELECT * FROM employees
                                    WHERE employees.manager_id IS NULL`;
                db.query(managerSql, (err, response) => {
                    if (err) throw error;
                    const managers = response.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
                    let none = 'NULL'
                    managers.push(none);
                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'manager',
                            message: "Who is the employee's manager?",
                            choices: managers 
                        }
                    ])
                    .then(employeeManager => {
                        if (employeeManager.manager !== 'NULL') {
                            const manager = employeeManager.manager;
                            params.push(manager);
                        } else {
                            const manager = null;
                            params.push(manager);
                        }
                        const sql = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                                     VALUES (?,?,?,?)`;
                        db.query(sql, params, (err) => {
                            if (err) throw error;
                            console.log(`Added ${answers.firstName, answers.lastName} to the database`);
                            viewAllEmployees();
                        });
                    });
                });
            });
        });
    });
};
// Add a Role
const addRole = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What is this title of this role?',
            validate: titleInput => {
                if (!titleInput) {
                    console.log('Please enter a title for the role');
                    return false;
                } else {
                    return true;
                }
            }
        },
        {
            type: 'input',
            name: 'salary',
            message: 'What is the salary for this role?'
        }
    ])
    .then((answers) => {
        const params = [answers.title, answers.salary];
        const deptSql = `SELECT departments.id, departments.name FROM departments`;
        db.query(deptSql, (err, response) => {
            if (err) throw error;
            const roleDept = response.map(({ id, name}) => ({ name: name, value: id }));
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'department',
                    message: 'Which department does the role belong to?',
                    choices: roleDept
                }
            ])
            .then(roleDepartment => {
                const dept = roleDepartment.department;
                params.push(dept);
                const sql = `INSERT INTO roles (title, salary, department_id)
                             VALUES (?, ?, ?)`;
                db.query(sql, params, (err) => {
                    if (err) throw error;
                    console.log(`Added ${answers.title} to the database`);
                    viewAllRoles();
                });
            });
        });
    });  
};
// Add a Department
const addDepartment = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?'
        }
    ])
    .then(answers => {
        const params = answers.name;
        const sql = `INSERT INTO departments (name)
                     VALUES (?)`;
        db.query(sql, params, (err) => {
            if (err) throw error;
            console.log(`Added ${params} to the database`);
            viewAllDepartments();
        })
    })
}
// Update Employee Role
const updateEmployee = () => {
    const employeeSql = `SELECT id, first_name, last_name FROM employees`;
    
    db.query(employeeSql, (err, response) => {
        if (err) throw error;
        const employeeNames = response.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
        inquirer.prompt([
            {
                type: 'list',
                name: 'employee',
                message: "Which employee's role would you like to update?",
                choices: employeeNames
            }
        ])
        .then(answers => {
            const id = answers.employee;    
            const roleSql = `SELECT roles.id, roles.title FROM roles`;
            db.query(roleSql, (err, response) => {
                if (err) throw error;
                const roles = response.map(({ id, title }) => ({ name: title, value: id}));
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'roles',
                        message: 'What is the new role of the employee?',
                        choices: roles
                    }
                ])
                .then(answers => {
                    const newRole = answers.roles;
                    const sql = `UPDATE employees SET role_id = ?
                                 WHERE id = ?`;
                    params = [newRole, id]
                    db.query(sql, params, (error) => {
                        if (error) throw error;
                        console.log(`Updated ${answers.employee} info in the database`);
                        viewAllEmployees();
                    })
                })

            })
            
        })
    
    })  
}
// Delete Department
const deleteDepartment = () => {
    const sql = `SELECT * FROM departments`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        const departments = response.map(({ id, name }) => ({ name: name, value: id}))
        inquirer.prompt([
            {
                type: 'list',
                name: 'delDept',
                message: "Which department would you like to delete?",
                choices: departments
            }
        ])
        .then(answers => {
            const delDept = answers.delDept
            const params = [delDept];
            const sql = `DELETE FROM departments WHERE departments.id = ?`
            db.query(sql, params, (err) => {
                if (err) throw error;
                console.log(`Deleted ${answers.delDept} Department from database`);
                viewAllDepartments();
            })
        })
    })
}
// Delete Role
const deleteRole = () => {
    const sql = `SELECT * FROM roles`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        const delRoles = response.map(({ id, title }) => ({ name: title, value: id }));
        inquirer.prompt([
            {
                type: 'list',
                name: 'delRole',
                message: 'Which role would you like to delete?',
                choices: delRoles
            }
        ])
        .then(answers => {
            const roleId = answers.delRole;
            const params = [roleId];
            const sql = `DELETE FROM roles WHERE roles.id = ?`;
            db.query(sql, params, (err) => {
                if (err) throw error;
                console.log(`Deleted ${answers.delRole} Role from database`);
                viewAllRoles();
            })
        })
    })
}
// Delete Employee
const deleteEmployee = () => {
    const sql = `SELECT * FROM employees`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        const delEmployee = response.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
        inquirer.prompt([
            {
                type: 'list',
                name: 'delEmployee',
                message: 'Which employee would you like to delete?',
                choices: delEmployee
            }
        ])
        .then(answers => {
            const employeeId = answers.delEmployee;
            const params = [employeeId];
            const sql = `DELETE FROM employees WHERE employees.id = ?`;
            db.query(sql, params, (err) => {
                if (err) throw error;
                console.log(`Deleted ${answers.delEmployee} from database`);
                viewAllEmployees();
            })
        })
    })
}
// Update Employee's Manager
const updateManager = () => {
    const sql = `SELECT id, first_name, last_name FROM employees`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        const employeeNames = response.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));
        inquirer.prompt([
            {
                type: 'list',
                name: 'employee',
                message: "What employee has a new Manager?",
                choices: employeeNames
            },
            {
                type: 'list',
                name: 'newManager',
                message: 'Who is their new Manager?',
                choices: employeeNames
            }
        ])
        .then(answers => {
            const employeeId = answers.employee.id;
            const managerId = answers.newManager.id;
            const params = [managerId, employeeId]
            const sql = `UPDATE employees SET employees.manager_id = ? WHERE employees.id = ?`;
            db.query(sql, params, (err) => {
                if (err) throw error;
                console.log(`Updated ${answers.employee}'s New Manager ${answers.newManager}`);
                viewAllEmployees();
            })
        })
    })
}
// Sort By Manager
const byManager = () => {
    const managerSql = `SELECT * FROM employees
                        WHERE employees.manager_id IS NULL`;
    db.query(managerSql, (err, response) => {
        if (err) throw (error);
        const selManager = response.map(({ id, first_name, last_name}) => ({ name: first_name + " " + last_name, value: id }));
        inquirer.prompt([
            {
                type: 'list',
                name: 'selManager',
                message: "Which manager's employees do you want to see?",
                choices: selManager
            }
        ])
        .then(answers => {
            const managerId = answers.selManager;
            
            const params = [managerId];
            const sql = `SELECT first_name, last_name FROM employees
                         WHERE employees.manager_id = ?`
            db.query(sql, params, (err, response) =>{
                if (err) throw error;
                console.table(response);
                userPrompt();
            });
        });
    });
};
// Start server after DB connection
db.connect(err => {
    if (err) throw err;
    console.log('Database connected.');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    })
    userPrompt();
});


