# Job Radar Scraper Sources & Registry (India Tech Seed)

## Seed Companies & Platform Classification

| Company | Careers URL | Platform / Adapter | Status | Notes / Frequency |
| :--- | :--- | :--- | :--- | :--- |
| **Google** | careers.google.com | Custom REST API | Supported | Poll interval: 4h. Rate limit: 1 req/sec. |
| **Microsoft** | jobs.careers.microsoft.com | Eightfold AI REST | Supported | Direct JSON endpoint. Filters: India + Intern. |
| **Amazon** | amazon.jobs | Amazon JSON API | Supported | Public JSON search API `/en/search.json`. |
| **Meta** | metacareers.com | GraphQL Endpoint | Supported | Public careers query. |
| **Apple** | jobs.apple.com | Apple Search API | Supported | `POST /en-in/search/requisitions`. |
| **Oracle** | careers.oracle.com | Oracle Cloud HCM | Supported | Requisition REST endpoint. |
| **IBM** | ibm.com/careers | BrassRing / Kenexa | Supported | Clean HTTP JSON parser. |
| **Intel** | jobs.intel.com | Phenom People | Supported | Phenom API endpoint. |
| **Nvidia** | nvidia.wd5.myworkdayjobs.com | Workday REST | Supported | Standard Workday `/wday/cxs/...` endpoint. |
| **Qualcomm** | careers.qualcomm.com | Eightfold AI REST | Supported | Direct API. |
| **Infosys InStep** | infosys.com/careers/instep.html | Program Page | Program Tracker | Content change detection on annual opening. |
| **TCS** | tcs.com/careers/india/internship | Program Page | Program Tracker | Seasonal batch cycle tracking. |
| **Wipro** | careers.wipro.com | SAP SuccessFactors | Supported | SuccessFactors REST adapter. |
| **Cognizant** | careers.cognizant.com | Phenom People | Supported | Phenom adapter. |
| **Capgemini** | capgemini.com/in-en/jobs | Custom REST | Supported | Clean JSON. |
| **Accenture** | accenture.com/in-en/careers | Custom REST API | Supported | Standard job search API. |
| **Deloitte** | apply.deloitte.com | SAP SuccessFactors | Supported | SuccessFactors adapter. |
| **PwC** | jobs.pwc.com | Workday REST | Supported | Workday CXS API. |
| **EY** | careers.ey.com | SAP SuccessFactors | Supported | SuccessFactors adapter. |
| **KPMG** | home.kpmg/xx/en/home/careers | Avature | Supported | Avature feed. |
| **Goldman Sachs**| goldmansachs.com/.../programs | Program Page | Program Tracker | Tracks student summer analyst opening cycle. |
| **JP Morgan** | careers.jpmorgan.com/programs | Oracle HCM / Prog | Supported | Oracle HCM + student program pages. |
| **Morgan Stanley**| morganstanley.tal.net | Tal.net / WCN | Supported | Vacancy JSON feed. |
| **Barclays** | search.jobs.barclays | Radancy / TalentBrew | Supported | Radancy search API. |
| **Uber** | uber.com/careers | Greenhouse / Custom | Supported | Public endpoint. |
| **Adobe** | careers.adobe.com | Phenom People | Supported | Phenom adapter. |
| **Salesforce** | careers.salesforce.com | Workday REST | Supported | Workday CXS API. |
| **SAP** | jobs.sap.com | SAP SuccessFactors | Supported | Native SuccessFactors feed. |
| **Cisco** | jobs.cisco.com | Custom REST | Supported | Standard search adapter. |
| **Siemens** | jobs.siemens.com | Eightfold AI REST | Supported | Eightfold API. |
| **Bosch** | careers.bosch.com | SmartRecruiters API | Supported | SmartRecruiters public company job board. |
| **Philips** | careers.philips.com | Phenom People | Supported | Phenom adapter. |
| **Lowe's India** | talent.lowes.com | Phenom People | Supported | Phenom adapter. |
| **Sony Research India**| sonyresearchindia.com/careers | HTML Parser | Supported | Direct employer listings. |

## Scraping & Compliance Policy
1. `robots.txt` is fetched and parsed before initiating scheduled polling for each host.
2. User-Agent string: `rJobsBot/1.0 (+https://rjobs.dev/bot; bot@rjobs.dev)`
3. Rate limits: Maximum 1 request every 2000ms per domain.
4. Circuit Breakers: 5 consecutive failed runs automatically transitions source to `failing` state and alerts maintainers.
