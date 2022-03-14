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
    });
};

const viewAllDepartments = () => {
    // console.log('Departments')
    const sql = `SELECT * FROM departments`;
    db.query(sql, (error, response) => {
        if (error) throw error;
        console.table(response);

        userPrompt();
    });
};

const viewAllRoles = () => {
    const sql = `SELECT * FROM roles`;
    db.query(sql, (error, response) => {
        if (error) throw error;
        console.table(response);

        userPrompt();
    });
};

const viewAllEmployees = () => {
    const sql = `SELECT * FROM employees`;
    db.query(sql, (error, response) => {
        if (error) throw error;
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
        const employeeInfo = [answers.firstName, answers.lastName]
        const roleSql = `SELECT role.id, role.title FROM role`;
        db.query(roleSql, (error, response) => {
            if (error) throw error;
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
                employeeInfo.push(role);
                const managerSql = `SELECT * FROM employees`;
                db.query(managerSql, (error, response) => {
                    if (error) throw error;
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
                        employeeInfo.push(manager);
                        const sql = `INSERT INTO employees (first_name, last_name, roles_id, manager_id)
                                     VALUES (?,?,?,?)`;
                        db.query(sql, employeeInfo, (error) => {
                            if (error) throw error;
                            console.log("Employee added!");
                            viewAllEmployees();
                        });
                    });
                });
            });
        });
    });
};

const addRole = () => {

}

const addDepartment = () => {

}

const updateEmployee = () => {

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


