
const {init} = require('../index');

async function createLikes() {

    const {disconnect, Like, Post, Comment, User} = await init({
        user: 'yzhuravlov',
        password: 'securepass'
    });

    const like = await Like.create({
        type: 'like',
    });

    await like.setAuthor(await User.findByPk(1));
    await like.setPost(await Post.findByPk(2));

    await like.updateUserRating();

    await disconnect();
}

createLikes();