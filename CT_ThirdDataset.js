const mysql = require('mysql');

const con = mysql.createConnection({
    // host: '10.11.90.16',localhost
    host: '10.11.90.16',
    user: 'AppUser',
    password: 'Special888%',
    database: 'dtrends'
});

let date = new Date();
date.getFullYear()+"-"+("0" + (date.getMonth() + 1)).slice(-2) + "-"+("0" + (date.getDate()-1)).slice(-2);
let Date_n =  "2021-01-19"
let First_Data ="SELECT * FROM dtrends.covid_19 WHERE Date = ?;"
let Sec_Data = "SELECT * FROM dtrends.covid_19_test WHERE Date = ?;"

con.query(Sec_Data,Date_n,function (err, Sec_Data) {
   // console.log(Sec_Data);
    con.query(First_Data,Date_n,function (err, First_Data) {
        // console.log(Sec_Data);
        let Third_data;
        for(let i = 1; i < Sec_Data.length; i++){
            let Only_Data = "SELECT LayerName FROM dtrends.covid_19 WHERE LayerName = ?;"
            con.query(Only_Data, Sec_Data[i].LayerName, function (err, result) {
                if(result == ""){
                    Third_data = Sec_Data[i].LayerName;
                    console.log(Third_data);
                }else{
                    console.log(i)
                }

            });
        }
        //what
        // console.log(Sec_Data[1].LayerName);
        // console.log(First_Data[1].LayerName);
        // SELECT dtrends.Test1.id,dtrends.Test1.Name,dtrends.Test1.TableNum
        // FROM  dtrends.Test1
        // LEFT JOIN  dtrends.Test2 ON  dtrends.Test1.id   =  dtrends.Test2.id
        // UNION
        // SELECT dtrends.Test2.id, dtrends.Test2.Name,dtrends.Test2.TabelNum
        // FROM  dtrends.Test2
        // LEFT JOIN  dtrends.Test1 ON  dtrends.Test2.id =  dtrends.Test1.id
        //SELECT * FROM dtrends.Test2;
        //
        // SELECT dtrends.Test1.id,dtrends.Test2.id,dtrends.Test1.Name,dtrends.Test2.Name,dtrends.Test1.TableNum,dtrends.Test2.TabelNum
        // FROM  dtrends.Test1
        // LEFT JOIN  dtrends.Test2 ON  dtrends.Test2.Name = dtrends.Test1.Name
        // WHERE dtrends.Test1.id   <>  dtrends.Test2.id;
        //
        // SELECT dtrends.Test1.id,dtrends.Test1.Name
        // FROM  dtrends.Test1
        // LEFT JOIN  dtrends.Test2 ON dtrends.Test1.id   <>  dtrends.Test2.id WHERE dtrends.Test2.Name <> dtrends.Test1.Name
        // UNION
        // SELECT dtrends.Test2.id, dtrends.Test2.Name
        // FROM  dtrends.Test2
        // LEFT JOIN  dtrends.Test1 ON  dtrends.Test2.id <> dtrends.Test1.id WHERE dtrends.Test2.Name <> dtrends.Test1.Name;
        //
        // Select * From dtrends.Test1,  dtrends.Test2 WHERE dtrends.Test1.id   <>  dtrends.Test2.id;
        //
        //
        // select dtrends.Test2.id, dtrends.Test2.Name
        // from dtrends.Test2
        // union all
        // select dtrends.Test1.id,dtrends.Test1.Name
        // from dtrends.Test1
        // where not exists (select 1 from dtrends.Test2,dtrends.Test1 where dtrends.Test2.id =dtrends.Test1.id);


    });

});
