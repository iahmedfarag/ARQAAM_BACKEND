export const asyncHandler = (API) => {
    return (req, res, next) => {
        API(req, res, next).catch((err) => {
            console.log(err, "error from error handling")
            res.status(500).json({ message: "failed" })
        })
    }
}