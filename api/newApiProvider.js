const fetch = require("node-fetch");

exports.getSpentStats = async () => {
  try {
    const response = await fetch("http://localhost:3081/getTotalSpent");

    if (response.status === 200) {
      return await response.json();
    } else {
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};
