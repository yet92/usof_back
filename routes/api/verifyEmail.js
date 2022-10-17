const { Router } = require("express");

function useEmailConfirmation(confirmEmail) {
    const router = Router();

    router.get("/:id/:token", async function (req, res, next) {
        try {
            const { id, token } = req.params;
            await confirmEmail(id, token);

            res.json({
                message: "Success confirmation",
            });
        } catch (err) {
            if (err.message === "Invalid confirm email data") {
                res.status(404).json({
                    name: "Verify Email Error",
                    message: "Invalid email confirmation link",
                });
            } else {
                next(err);
            }
        }
    });

    return { router };
}

module.exports = useEmailConfirmation;
