const chokidar = require('chokidar')
const axios = require('axios')
const fs = require('fs')
const moment = require('moment')
const jsonfile = require('jsonfile')
const knex = require('../db')
const dotenv = require("dotenv").config()



const watcher = chokidar.watch('C:\\Users\\integ\\Desktop\\testeuber\\cabecalho', { ignored: /(^|[\/\\])\../ }).on('all', function (event, filePath) {
  //console.log(file);

});
watcher.on('add', async filePath => {
  var spl = filePath.replace('C:\\Users\\integ\\Desktop\\testeuber\\cabecalho', '')
  console.log("no watch " + spl)
  conv(spl)
})

async function conv(spl) {
  try {
    console.log("no conv " + spl)
    fs.readFile(`C:\\Users\\integ\\Desktop\\testeuber\\cabecalho\\${spl}`, 'utf-8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      var data = data.substring(
        data.indexOf("\"BR Uber Primary\",")
      );

      const writeStream = fs.createWriteStream(`C:\\Users\\integ\\Desktop\\testeuber\\semcabecalho\\${spl}`, { flags: 'a' });

      writeStream.write(data);
      writeStream.end();

      writeStream.on('close', () => {
        console.log('Stream closed');
        fs.unlinkSync(`C:\\Users\\integ\\Desktop\\testeuber\\cabecalho\\${spl}`)
        CriaJson(spl)
      });
    });



    async function CriaJson(spl) {
      const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

      function encontrarMes(nomeMes) {
        const indice = meses.indexOf(nomeMes);
        if (indice === -1) {
          throw new Error('Mês inválido');
        }
        return indice + 1;
      }

      let lines = {
        AutheticationToken: {
          Username: process.env.USERNAME_AUTHENTICATION,
          Password: process.env.PASSWORD_AUTHENTICATION,
          EnvironmentName: process.env.ENVIRONMENT_NAME_AUTHENTICATION
        },
        Data: {
          InterfacedaContabilidade: []
        }
      }

      var result = await knex.raw(`SELECT description, descricao FROM depara `);

      const map = new Map();

      result.rows.forEach((row) => map.set(row.description, row.descricao));
      let seq = 0;
      var cont = 0;
      fs.readFile(`C:\\Users\\integ\\Desktop\\testeuber\\semcabecalho\\${spl}`, 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        const split = data.split('\n')
        const NumerosDocumentos = new Map();
        for (let i = 0; i < split.length; i++) {
          const line = split[i]
          const obj = line.split('",')



          if (line.trim().length > 0) {
            const loteBruto = obj[2].replace('"', '')
            var buscaMes = encontrarMes(loteBruto.substring(0, 3))
            const mes = buscaMes < 10 ? `0${buscaMes}` : `${buscaMes}`;
            const loteContabil = mes + "20" + loteBruto.replace(`${loteBruto.substring(0, 3)}-`, '')
            const documentoBruto = obj[56].replace('"', '')
            var numeroDocumento = documentoBruto.substring(documentoBruto.length - 5)
            if (!NumerosDocumentos.has(numeroDocumento)) {
              cont += 1
              NumerosDocumentos.set(numeroDocumento, {
                SequenciadoRegistro: cont,
                CodigodaEmpresa: obj[4].replace('"', ''),
                LoteContabil: loteContabil,
                DatadoLancamento: moment(obj[22].replace('"', '')).format('DD/MM/YYYY'),
                NumerodoDocumento: numeroDocumento,
                InterfaceDetalhedaContabilidade: []
              });
            }

            const par = obj[49].replace('"', '');
            const indicador = par < 0 ? 'D' : 'C';
            const valor = par.replace('-', '');
            seq += 1
            const hist = obj[16].replace('"', '')
            const value = map.get(hist) || hist;
            NumerosDocumentos.get(numeroDocumento).InterfaceDetalhedaContabilidade.push({
              ContaContabil: obj[8].replace('"', ''),
              //CentrodeCusto: obj[66].replace('"', ''),
              IndicadordoLancamento: "D",
              HistoricodoLancamento: value + obj[41].replace('"', '') + " " + obj[33].replace('"', ''),
              ValordoLancamento: valor,
              DatadeDigitacaodoLancamento: moment(obj[22].replace('"', '')).format('DD/MM/YYYY'),
              SequencialdoLancamento: `${seq}`,
              CodigodoProjeto: "",
              ComplementodoHistoricoPadrao1: obj[56].replace('"', ''),
              ComplementodoHistoricoPadrao2: "",
              ComplementodoHistoricoPadrao3: obj[20].replace('"', ''),
            });
            seq += 1
            NumerosDocumentos.get(numeroDocumento).InterfaceDetalhedaContabilidade.push({
              ContaContabil: obj[8].replace('"', ''),
              //CentrodeCusto: obj[66].replace('"', ''),
              IndicadordoLancamento: "C",
              HistoricodoLancamento: value + obj[41].replace('"', '') + " " + obj[33].replace('"', ''),
              ValordoLancamento: valor,
              DatadeDigitacaodoLancamento: moment(obj[22].replace('"', '')).format('DD/MM/YYYY'),
              SequencialdoLancamento: `${seq}`,
              CodigodoProjeto: "",
              ComplementodoHistoricoPadrao1: obj[56].replace('"', ''),
              ComplementodoHistoricoPadrao2: "",
              ComplementodoHistoricoPadrao3: obj[20].replace('"', ''),
            });
          }

        }

        lines.Data.InterfacedaContabilidade = [...NumerosDocumentos.values()];


        fs.mkdir(`C:\\Users\\integ\\Desktop\\testeuber\\json\\${spl}`, { recursive: true }, (err) => {
          if (err) {
            console.log(err);
          } else {

            console.log('Pasta criada com sucesso!');
          }
        });


        fs.writeFile(`C:\\Users\\integ\\Desktop\\testeuber\\json\\${spl}\\${spl}`, data, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log('Arquivo escrito!');
            addPost(data);
          }
        });


        jsonfile.writeFile(`C:\\Users\\integ\\Desktop\\testeuber\\json\\${spl}\\${lines.Data.InterfacedaContabilidade.loteContabil}.json`, lines, (err) => {
          if (err) {
            console.error(err);
            returnn;
          }
          console.log('Arquivo salvo com sucesso!');
        });
      });
      addPost = () => axios.post('https://prjkpmg.mxmwebmanager.com.br/api/InterfacedaContabilidade/Gravar', lines)
        .then(response => {
          console.log(response)
        })
        .catch(error => {
          console.log(error);
        });

    }

  } catch (err) {
    console.error(err);
  }

}
