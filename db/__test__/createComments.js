
const {init} = require('../index');

async function createComments() {

    const {disconnect, Comment, User, Post} = await init({
        user: 'yzhuravlov',
        password: 'securepass'
    });

    const comment1 = await Comment.create({
        content: 'Good job'
    });
    await comment1.setAuthor(await User.findByPk(1));

    const comment2 = await Comment.create({
        content: 'Bad data'
    });
    await comment2.setAuthor(await User.findByPk(2));

    const post = await Post.findByPk(3);
    await post.addComment(comment1);
    await post.addComment(comment2);

    await disconnect();

}

createComments();