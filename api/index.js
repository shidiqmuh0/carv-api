const express = require('express');
const { ethers } = require('ethers');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

async function getTotalSupply() {
  // Connect to the different network providers
  const roninProvider = new ethers.providers.JsonRpcProvider("https://api.roninchain.com/rpc");
  const opbnbProvider = new ethers.providers.JsonRpcProvider("https://opbnb-mainnet-rpc.bnbchain.org");
  const zksyncProvider = new ethers.providers.JsonRpcProvider("https://mainnet.era.zksync.io");
  const lineaProvider = new ethers.providers.JsonRpcProvider("https://rpc.linea.build");

  // ABI for ERC-20 totalSupply
  const abi = [
    "function totalSupply() view returns (uint256)"
  ];

  // Token contract addresses
  const roninTokenAddress = "0xc39a2430b0b6f1edad1681672b47c857c1be0998";
  const opbnbTokenAddress = "0xc32338e7f84f4c01864c1d5b2b0c0c7c697c25dc";
  const zksyncTokenAddress = "0x5155704BB41fDe152Ad3e1aE402e8E8b9bA335D3";
  const lineaTokenAddress = "0xC5Cb997016c9A3AC91cBe306e59B048a812C056f";

  // Create contract instances for each network
  const roninContract = new ethers.Contract(roninTokenAddress, abi, roninProvider);
  const opbnbContract = new ethers.Contract(opbnbTokenAddress, abi, opbnbProvider);
  const zksyncContract = new ethers.Contract(zksyncTokenAddress, abi, zksyncProvider);
  const lineaContract = new ethers.Contract(lineaTokenAddress, abi, lineaProvider);

  // Fetch total supplies for all networks
  const roninSupply = await roninContract.totalSupply();
  const opbnbSupply = await opbnbContract.totalSupply();
  const zksyncSupply = await zksyncContract.totalSupply();
  const lineaSupply = await lineaContract.totalSupply();

  // Calculate total supply by summing up all supplies
  const totalSupply = ethers.BigNumber.from(roninSupply)
    .add(opbnbSupply)
    .add(zksyncSupply.mul(10)) // zkSync multiplied by 10
    .add(lineaSupply);

  return ethers.utils.formatUnits(totalSupply, 0); // Return formatted total supply
}

async function getLatestPrice() {
  try {
    const response = await axios.get('https://www.kucoin.com/_api/grey-market-trade/grey/market/statistics?lang=en_US&symbol=CARV-USDT');
    const lastPrice = response.data.data.latestPrice;
    return lastPrice;
  } catch (error) {
    console.error('Error fetching latest price:', error);
    return null;
  }
}

app.get('/api/', async (req, res) => {
  try {
    // Fetch total supply and latest price concurrently
    const [totalSupply, latestPrice] = await Promise.all([getTotalSupply(), getLatestPrice()]);

    res.json({
      total: totalSupply,
      lastPrice: latestPrice ? latestPrice : 'Price not available'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
