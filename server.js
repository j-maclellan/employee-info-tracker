const express = require('express');
const apiRoutes = require('./routes/apiRoutes');
const inquirer = require('inquirer');


// Imports
const db = require('./db/connection');
const { response } = require('express');
const res = require('express/lib/response');


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
                      'Add a Department', 'Add a Role', 'Add an Employee', 'Update an Employee Role']
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
    });
};

const viewAllDepartments = () => {
    // console.log('Departments')
    const sql = `SELECT * FROM departments`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        console.table(response);

        userPrompt();
    });
};

const viewAllRoles = () => {
    const sql = `SELECT * FROM roles`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        console.table(response);

        userPrompt();
    });
};

const viewAllEmployees = () => {
    const sql = `SELECT * FROM employees`;
    db.query(sql, (err, response) => {
        if (err) throw error;
        console.table(response);
        userPrompt();
    });
};

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
        const roleSql = `SELECT role.id, role.title FROM role`;
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
                const managerSql = `SELECT * FROM employees`;
                db.query(managerSql, (err, response) => {
                    if (err) throw error;
                    const managers = response.map(({ id, first_name, last_name }) => ({ name: first_name + "" + last_name, value: id }));
                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'manager',
                            message: "Who is the employee's manager?",
                            choices: managers
                        }
                    ])
                    .then(employeeManager => {
                        const manager = employeeManager.manager;
                        params.push(manager);
                        const sql = `INSERT INTO employees (first_name, last_name, roles_id, manager_id)
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
                const sql = `INSERT INTO roles (title, salary, departments_id)
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
            const id = answers.employee.id;
            const roleSql = `SELECT id, title FROM roles`;
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
                    const newRole = answers.roles.id;
                    const sql = `UPDATE employees SET roles_id = ?
                                 WHERE id = ?`;
                    params = [id, newRole]
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
// Start server after DB connection
db.connect(err => {
    if (err) throw err;
    console.log('Database connected.');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    })
    userPrompt();
});


