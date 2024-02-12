import mongoose from "mongoose";

export const connectionDB = async () => {
    return await mongoose
        .connect(process.env.DB_URL)
        .then((res) => console.log("db connected..."))
        .catch((err) => console.log(err));
};
