const service = require('./service.js');
//const _ = require('lodash'); 

const controller = {};

//connection to databases 
service.connect(
    //successCb
    function (){
        //if click on '+' save income item to MongoDB with ’title’, ’income’ and ’date’ (current date)
        controller.createNewIncome = function(){
            let errorMessage = document.getElementById('error-div');
            let titleInput = document.getElementById('titleInput');
            let sum = document.getElementById('sum')
            if(titleInput.value != '' && sum.value != ''){
                service.saveIncome(titleInput.value,sum.value);
                titleInput.value = '';
                sum.value = '';
            
                //show total
                //below the input fields there is a 'Total' paragraph that shows the difference between 'income' and 'expense' stored in Redis. This is updated every time the user presses '+' or '-'
                controller.showTotal();
            
                //show chart
                controller.showChart();
            
                //show table
                controller.loadTable();
            }
            else{
                errorMessage.style.visibility = 'visible';
                errorMessage.innerText = "Please fill the whole form to save an item to the database";
                setTimeout(() => errorMessage.style.visibility = 'hidden', 4000);
            }
        }


        //if click on '-' save expense item to MongoDB with ’title’, ’income’ and ’date’ (current date)
        controller.createNewExpense = function(){
            let errorMessage = document.getElementById('error-div');
            let titleInput = document.getElementById('titleInput');
            let sum = document.getElementById('sum')
            if(titleInput.value !='' && sum.value != ''){
                service.saveExpense(titleInput.value,sum.value);
                titleInput.value = '';
                sum.value = '';
            
                //show total
                //below the input fields there is a 'Total' paragraph that shows the difference between 'income' and 'expense' stored in Redis. This is updated every time the user presses '+' or '-'
                controller.showTotal();
            
                //show chart
                controller.showChart();
            
                //show table
                controller.loadTable();
                }
            else{
                errorMessage.style.visibility = 'visible';
                errorMessage.innerText = "Please fill the whole form to save an item to the database";
                setTimeout(() => errorMessage.style.visibility = 'hidden', 4000);
            }
        }

    },
    //failCB
    function(err){
        let errorMessage = document.getElementById('error-div');
        errorMessage.style.visibility = 'visible';
        errorMessage.innerText = "Connection to database failed: " + err;
        window.actionEnabled = false;
    }
);


//below 'Total' , if click on '+' or '-' show table with all expenses and incomes from MongoDB, the first row of the table: ’date’, ’title’, ’income’, ’expense’
controller.loadTable = async function(){
    let allInfosDiv = document.getElementById('all-expense-income');
    let table = document.createElement('table');
    let tr = document.createElement('tr'); 

    allInfosDiv.innerHTML = '';

    //creating the th tags and pushing to thArray list
    let thArray = [];
    for(let y = 0; y < 4; y++){
        let th = document.createElement('th');
        thArray.push(th);
    }

    //the first row of the table
    let headerTags = ['Date','Title', 'Income','Expense'];


    //adding the innerHTML to th and appending to tr
    for(let i = 0; i < 4; i++){
        thArray[i].innerHTML = headerTags[i];
        tr.appendChild(thArray[i]);
    }
    table.appendChild(tr);  
    allInfosDiv.appendChild(table);



    /*
    goes through the income collection and creates the rows for the table depending on how many items there are in the database, then the same for the expense collection
    first displays every income and puts a '-' in the expense column
    then displays every expense and puts a '-' in the income column
    */
    const incomeCount = await service.incomeItem.find({}).count();
    let allIncomes = await service.incomeItem.find({});
    for( let b = 0; b < incomeCount; b++){
        let newTr = document.createElement('tr');
        newTr.classList.add('income');
        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');
        let td4 = document.createElement('td');
        td1.innerHTML =  allIncomes[b].date; 
        td2.innerHTML =  allIncomes[b].title; 
        td3.innerHTML =  allIncomes[b].income; 
        td4.innerHTML =  '-'; 
        newTr.appendChild(td1);
        newTr.appendChild(td2);
        newTr.appendChild(td3);
        newTr.appendChild(td4);
        table.appendChild(newTr);
    }

    //expense collection
    const expenseCount = await service.expenseItem.find({}).count();
    let allExpense = await service.expenseItem.find({});
    for( let b = 0; b < expenseCount; b++){
        let newTr = document.createElement('tr');
        newTr.classList.add('expense');
        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        let td3 = document.createElement('td');
        let td4 = document.createElement('td');
        td1.innerHTML =  allExpense[b].date; 
        td2.innerHTML =  allExpense[b].title; 
        td4.innerHTML =  allExpense[b].expense; 
        td3.innerHTML =  '-'; 
        newTr.appendChild(td1);
        newTr.appendChild(td2);
        newTr.appendChild(td3);
        newTr.appendChild(td4);
        table.appendChild(newTr);
    }
    allInfosDiv.appendChild(table);
}

//below the input fields there is a 'Total' paragraph that shows the difference between 'income' and 'expense' stored in Redis. This is updated every time the user presses '+' or '-'
controller.showTotal = function(){
    let total = document.getElementById('total');

    service.getTotals(function(sumIncome, sumExpense){
        let value = sumIncome - sumExpense
        //display stepSize, thousands separator, show HUF
        value = value.toString();
        value = value.split(/(?=(?:...)*$)/);
        value = value.join('.');
        total.innerHTML = value + ' HUF'
    })
}


//Extra: chart js
//above table show chart with two bars (expense and income), this is updated every time the user presses '+' or '-'
controller.showChart = function(){
    let chartLabels = ['income', 'expense'];
    let myChart = document.getElementById('myChart');
    service.getTotals(function(sumIncome, sumExpense){
        new Chart(
            myChart,
            {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        backgroundColor: ['green', 'red'],
                        data: [sumIncome, sumExpense]
                    }]
                },
                options: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'My income and expense chart',
                        fontSize: 40
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                stepSize: 500, 
                                fontSize: 20,
                                //y axis: display stepSize, thousands separator, show HUF
                                callback: function(value, index, ticks){
                                    value = value.toString();
                                    value = value.split(/(?=(?:...)*$)/);
                                    value = value.join('.');
                                    return value + ' HUF'
                                }
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                fontSize: 20
                            }
                        }]
                    }
                }
            }
        )

    })

    //styling chart
    myChart.style.backgroundColor = '#abc8eb';
    myChart.style.border = '3px solid #4183ce';
    myChart.style.borderRadius = '10px'
}


module.exports = controller;