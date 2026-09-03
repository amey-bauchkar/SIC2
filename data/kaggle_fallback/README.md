# Kaggle Agmarknet Historical Mirror (Emergency Fallback)

This dataset serves as an emergency offline backup if both the live `data.gov.in` API and CEDA portal are unreachable during the hackathon.

## Dataset Details
* **Dataset Name:** Daily Market Prices of Commodity India (2001-2026)
* **Author / Provider:** Kaggle open dataset compiled from AGMARKNET
* **Size:** ~75 Million records across 374 commodities
* **Format:** Parquet / CSV

## Direct Access Links
* Search on Kaggle: `Daily Market Prices of Commodity India (2001-2026)`
* Direct URL: `https://www.kaggle.com/datasets` -> Filter by `agmarknet daily prices`

## How to extract subset for MandiMitra
If downloaded, place the Parquet/CSV file in this folder and filter for:
* State: `Maharashtra`
* Districts: `Nashik`, `Pune`, `Latur`
* Commodities: `Onion`, `Tomato`, `Soyabean`
