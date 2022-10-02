async function createDefaultAdminUser(
    {
        login = 'admin',
        email = 'admin@mail.com',
        password = 'admin',
        createUser
    }) {

    try {
        await createUser(
            {
                login, email, password,
                role: 'admin',
                isEmailConfirmed: true
            }
        );
    } catch (err) {
        console.log(err.message);
    }

}

async function createDefaultUser(
    {
        login = 'user',
        email = 'user@email.com',
        password = 'user',
        createUser
    }) {
    try {
        await createUser(
            {
                login, email, password,
                role: 'user',
                isEmailConfirmed: true
            }
        );
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = {createDefaultAdminUser, createDefaultUser};