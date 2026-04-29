const { StatusCodes } = require ("http-status-codes");

const register = (req, res) => {
    const newUser = req.body;
    global.users.push(newUser);
    
    const responseData = {...newUser};
    delete responseData.password;

    res.status(StatusCodes.CREATED).json(responseData);
};

const logon = (req, res) => {
    const { email, password } = req.body;
    const user = global.users.find (u => u.email === email && u.password === password);

    if(user) {
        global.user_id = user;
        res.status(StatusCodes.OK).json ({ name : user.name, email : user.email});
    } else {
        res.status(StatusCodes.UNAUTHORIZED).json({message : "Authentication Failed"});
    }
};


const logoff = (req, res) => {
    global.user_id = null;
    return res.status(StatusCodes.OK);
};

module.exports = { register, logon, logoff };