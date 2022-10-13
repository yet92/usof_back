const {init} = require('../index');
const {Op, QueryTypes, where} = require('sequelize');
const sequelize = require('sequelize');
const {logAsJSON} = require("../../lib/debug");

function getPagination(pageNumber) {
    const limit = 10;

    return {
        limit,
        offset: (pageNumber - 1) * limit
    }

}

async function filterPosts(pageNumber, userRole, userId,
                           {
                               sortBy = 'likes',
                               filters:
                                   {categoryIds = null,
                                       withStatus,
                                       dateInterval:
                                           {from, to} = {from: null, to: null}
                                   } = {}
                           }, Post, sequelize) {

    // let where = {};
    //
    // if (userRole !== 'admin') {
    //     where[Op.or] = [
    //         {status: 'active'},
    //         {author_id: userId}
    //     ]
    // }
    //
    // const {limit, offset} = getPagination(pageNumber);
    // const include = [];
    // let literal;
    // let categoriesPostIds;
    // let as;
    // if (categoryIds) {
    //
    //     const categoryIdsOr = categoryIds.map(id => {
    //         return `CategoryId=${id}`
    //     }).join(' or ');
    //     const count = `count=${categoryIds.length}`;
    //
    //     console.log('CategoryIdsOr:\n', categoryIdsOr);
    //
    //
    //
    //     logAsJSON(categoriesPostIds);
    //
    //     as = 'categoriesPosts';
    //
    //     include.push({
    //         [as]: sequelize.literal(literal),
    //     })
    //
    //     logAsJSON(include);
    //
    //     where[Op.and] = {
    //         id: `counts.PostId`
    //     }
    //
    // }
    //
    // const {rows: posts, count} = await Post.findAndCountAll({
    //
    //     where,
    //     offset,
    //     limit,
    //     include: [{
    //         model: categoriesPostIds,
    //         required: true
    //     }],
    //     subQuery: false
    //
    // });
    //
    //
    // return {posts, pagesCount: Math.ceil(count / limit)};

    const selectExpr = ['*'];
    const whereExpr = [];
    const fromExpr = ['Posts'];
    let orderBy = `ORDER BY likes DESC`;

    if (userRole !== 'admin') {
        whereExpr.push(
            `(status='active' OR author_id=${userId})`
        )
    }

    if (categoryIds) {
        const categoryIdsOr = categoryIds.map(id => {
            return `CategoryId=${id}`
        }).join(' or ');


        fromExpr.push(
            `
            (
                select * from (
                    select *, COUNT(*) as count FROM (
                        select PostId from Post_Categories 
                            as postids where ${categoryIdsOr} 
                        ) as counts
                          group by PostId
                ) as postsWithCategories
                where count=${categoryIds.length}
            ) as pc
            `
        )

        whereExpr.length
            ?
            whereExpr.push(
                `AND Posts.id=PostId`
            )
            : whereExpr.push(
                `Posts.id=PostId`
            );

    }

    if (sortBy === 'likes') {
        selectExpr.push(
            `(
                SELECT COUNT(*) 
                FROM Likes
                WHERE 
                    Likes.post_id = \`Posts\`.id  
                    AND
                    Likes.type = "like"
            ) as likes`
        )
    } else if (sortBy === 'date') {
        orderBy = `ORDER BY createdAt DESC`
    }

    if (withStatus) {
        if (whereExpr.length) {
            whereExpr.push(`AND status='${withStatus}'`);
        } else {
            whereExpr.push(`status='${withStatus}'`);
        }
    }


    if (from && to) {
        const formattedFrom = `date('${from.getFullYear()}-${from.getMonth() + 1}-${from.getDate()}')`;
        const formattedTo = `date('${to.getFullYear()}-${to.getMonth() + 1}-${to.getDate()}')`;
        if (whereExpr.length) {
            whereExpr.push(`AND date(createdAt) between ${formattedFrom} AND ${formattedTo}`);
        }
    }


    const query = `
        SELECT ${selectExpr.join(', ')} FROM ${fromExpr.join(', ')} WHERE ${whereExpr.join(' ')} ${orderBy}
    `
    console.log(query);

    const posts = await sequelize.query(query, {
        type: QueryTypes.SELECT
    });
    console.table(posts);
    return posts;

}

async function main() {
    const {Post, Post_Categories, sequelize} = await init({
        user: 'yzhuravlov',
        password: 'securepass'
    });
    //
    // const {posts, pagesCount} = await filterPosts(1, 'user', 2, {
    //     filters: {
    //         categoryIds: [1, 2]
    //     }
    // }, Post, sequelize);

    // logAsJSON(posts);

    await filterPosts(1, 'user', 2, {
        filters: {
            categoryIds: [1, 2]
        }
    }, Post, sequelize);

    await filterPosts(1, 'user', 2, {
        sortBy: 'likes',
        filters: {
            categoryIds: [1, 2]
        }
    }, Post, sequelize);

    await filterPosts(1, 'user', 2, {
        sortBy: 'date',
    }, Post, sequelize);

    await filterPosts(1, 'user', 2, {
        sortBy: 'date',
        filters: {
            withStatus: 'inactive'
        }
    }, Post, sequelize);
    await filterPosts(1, 'user', 2, {
        sortBy: 'date',
        filters: {
            withStatus: 'active',
            dateInterval: {
                from: new Date(),
                to: new Date()
            }
        }
    }, Post, sequelize);
}

main();
