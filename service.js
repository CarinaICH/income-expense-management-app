//let _ = require('lodash');
let mongoose = require('mongoose');
let redis = require('redis');
const controller = require('./controller');
let client;

const service = {};

//connecting to databases
service.connect = function (successCb, failCb){

    let dbReady = false;
    let mqReady = false;

    //MongoDB
    const db = mongoose.connect('mongodb://127.0.0.1:27017/cubix?authSource=admin', { useNewUrlParser: true, useUnifiedTopology: true });

    //Redis
    client = redis.createClient();

    db.then(function () {
        dbReady = true;

        if (mqReady === true) {
            successCb();
        }
    }, failCb);

    client.connect().then(function () {
        mqReady = true;
        if (dbReady === true){
            successCb();
        }
    });
    client.on('error', failCb);
}

//disconnect 
service.disconnect = function(){
    mongoose.connection.close();
    client.disconnect();
}


//cubix-->incomes
service.incomeItem = mongoose.model('income', new mongoose.Schema({
    title: String,
    income: {type: Number, min:0},
    date: Date
}));


//cubix-->expenses
service.expenseItem = mongoose.model('expense', new mongoose.Schema({
    title: String,
    expense: {type: Number, min:0},
    date: Date
}));


/*if click on '+' save income item to MongoDB with ’title’, ’income’ and ’date’ (current date)*/
service.saveIncome = async function(title, income){
    let newIncomeItem = new service.incomeItem({
        title: title,
        income: income,
        date: new Date()
    });
    newIncomeItem.save();
    client.INCRBY('income', income);
}

/*if click on '-' save expense item to MongoDB with ’title’, ’income’ and ’date’ (current date) */
service.saveExpense = async function(title, expense){
    let newExpenseItem = new service.expenseItem({
        title: title,
        expense: expense,
        date: new Date()
    });
    newExpenseItem.save();
    client.INCRBY('expense', expense)
}


//get income and expense 
service.getTotals = async function(cb){
    let getIncome = await client.GET('income');
    let getExpense = await client.GET('expense')
    cb(getIncome, getExpense);
}



module.exports = service;
