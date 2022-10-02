const {init} = require('../index');

async function createUsers() {
    const {User, disconnect} = await init({
        user: 'yzhuravlov',
        password: 'securepass'
    });

    const user1 = await User.create({
        login: 'first',
        email: 'email@email.com',
        password: 'password',
        fullName: 'FULL NAME'
    });

    const user2 = await User.create({
        login: 'second',
        email: 'email1@email.com',
        password: 'password',
        fullName: 'FULL NAME'
    });

    await disconnect();
}

createUsers();
