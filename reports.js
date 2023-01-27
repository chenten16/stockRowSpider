const axios = require("axios");
const fs = require("fs");
const path = require("path");
const fetchReport = async (symbol, dimension = "Q", report) => {
  const URL = `https://stockrow.com/api/companies/${symbol}/financials.json?ticker=${symbol}&dimension=${dimension}&section=${report}`;
  const response = await axios.get(URL);
  return response.data;
};

const getIndicators = async () => {
  const response = await axios.get("https://stockrow.com/api/indicators.json");
  return response.data;
};
const getCompanies = async () => {
  const response = await axios.get("https://stockrow.com/api/companies.json");
  return response.data;
};
const humanizeData = (indicators, data) => {
  let formattedData = {};
  for (const row of data) {
    const indicator = indicators.find((x) => x.id === row.id);
    if (indicator) {
      let obj = { ...row };
      delete obj.id;
      formattedData[indicator.name] = obj;
    }
  }
  return formattedData;
};

const saveToFile = (folderName, filename, data) => {
  const dir = path.resolve(path.join(__dirname, "data", folderName));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  fs.writeFileSync(dir + "/" + filename, JSON.stringify(data));
};

const getBalanceSheet = async (ticker, period, fileSuffix, indicators) => {
  try {
    const data = await fetchReport(ticker, period, "Balance Sheet");
    const formattedData = humanizeData(indicators, data);
    saveToFile(ticker, fileSuffix, formattedData);
  } catch (error) {
    console.log("error happened while getting balance sheet", ticker, period);
  }
};
const getCashFlow = async (ticker, period, fileSuffix, indicators) => {
  try {
    const data = await fetchReport(ticker, period, "Cash Flow");
    const formattedData = humanizeData(indicators, data);
    saveToFile(ticker, fileSuffix, formattedData);
  } catch (error) {
    console.log("error happened while getting cashflow ", ticker, period);
  }
};
const getIncomeStatement = async (ticker, period, fileSuffix, indicators) => {
  try {
    const data = await fetchReport(ticker, period, "Income Statement");
    const formattedData = humanizeData(indicators, data);
    saveToFile(ticker, fileSuffix, formattedData);
  } catch (error) {
    console.log(
      "error happened while getting income statement ",
      ticker,
      period
    );
  }
};
const run = async () => {
  let count = 0;
  const indicators = await getIndicators();
  const companies = await getCompanies();
  setInterval(() => {
    console.log("Total crawled companies is " + count);
  }, 10 * 1000);
  for (const company of companies) {
    console.log(`Crawling ${company.company_name}| Ticker: ${company.ticker}`);
    await getBalanceSheet(
      company.ticker,
      "A",
      "balanceSheetAnnual.json",
      indicators
    );
    await getBalanceSheet(
      company.ticker,
      "Q",
      "balanceSheetQuarter.json",
      indicators
    );

    await getCashFlow(company.ticker, "A", "cashFlowAnnual.json", indicators);
    await getCashFlow(company.ticker, "Q", "cashFlowQuarter.json", indicators);
    await getCashFlow(company.ticker, "T", "cashFlowTrailing.json", indicators);

    await getIncomeStatement(
      company.ticker,
      "A",
      "incomeStatementAnnual.json",
      indicators
    );
    await getIncomeStatement(
      company.ticker,
      "Q",
      "incomeStatementQuarter.json",
      indicators
    );
    await getIncomeStatement(
      company.ticker,
      "T",
      "incomeStatementTrailing.json",
      indicators
    );
    count++;
  }
};
run();
