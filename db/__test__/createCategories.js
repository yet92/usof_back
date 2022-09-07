
const {init} = require('../index');

async function createCategories() {

    const {Category, disconnect} = await init({
        user: 'yzhuravlov',
        password: 'securepass'
    })


    const category1 = await Category.create({
        title: 'Programming',
        description: 'About Programming'
    })

    const category2 = await Category.create({
        title: 'JS',
        description: 'About JS'
    })

    await disconnect();

}

createCategories();