const {init} = require("../index");

async function createPosts() {
    const { Post, disconnect, User } = await init({
        user: 'yzhuravlov',
        password: 'securepass'
    });

    const post1 = await Post.create({
        title: 'First Post',
        content: 'First Post about programming',
    })

    const author = await User.findOne({where: {login: 'first'}});
    if (author) {
        const post2 = await Post.create({
            title: 'Second Post',
            content: 'Second Post about programming on JS',
        })
        await post2.setAuthor(author);
    }

    const post3 = await Post.create({
        title: 'Third Post',
        content: 'Third Post about programming on Node.js',
    })

    await disconnect();
}

createPosts();
