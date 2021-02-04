const mysql = require('mysql');

const con = mysql.createConnection({
    // host: '10.11.90.16',localhost
    host: '10.11.90.16',
    user: 'AppUser',
    password: 'Special888%',
    database: 'dtrends'
});

let date = new Date();
let Date_n =  date.getFullYear()+"-"+("0" + (date.getMonth() + 1)).slice(-2) + "-"+("0" + (date.getDate()-1)).slice(-2);
let First_Data ="SELECT * FROM dtrends.covid_19 WHERE Date = ?;"
let Sec_Data = "SELECT * FROM dtrends.covid_19_test WHERE Date = ?;"

con.query(Sec_Data,Date_n,function (err, Sec_Data) {
   // console.log(result);
    con.query(First_Data,Date_n,function (err, result) {
        console.log(result);
    });

});
