// Hunter Mast / (574)-536-1954 / HunterCadeMast@gmail.com / linkedin.com/in/huntercademast / github.com/HunterCadeMast / 2/27/2025

// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");
// We use 'readline' for prompting and asking questions.
const readline = require('readline');

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  let articlesSorted = new Map;
  let matchingSearch = [];
  let label = "";
  // We start out by asking a question to the user of if they would like to search or sort the list of articles.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  let questionFlag = true
  // We loop through the question to make sure we get an answer that is one of our options.
  while (questionFlag == true) {
    // This allows us to wait for our question to be resolved.
    const sortQuestion = (query) => {
      return new Promise((resolve) => rl.question(query, resolve));
    };
    console.log("Sorting Options:\n1. Newest to Oldest\n2. Oldest to Newest\n3. A to Z\n4. Z to A\n5. Author from A to Z\n6. Author from Z to A\n7. Website from A to Z\n8. Website from Z to A\n9. Highest to Lowest\n10. Lowest to Highest\n");
    console.log("Searching Options:\n1. Search Keyword\n2. Search Author\n3. Search Website\n");
    const sortMethod = await sortQuestion("Please type an action from above: ");
    console.log("");
    // If it is a valid option, we perform the action and if not, we repeat the question.
    if (["newest to oldest", "oldest to newest", "a to z", "z to a", "author from a to z", "author from z to a", "website from a to z", "website from z to a", "highest to lowest", "lowest to highest", "search keyword", "search author", "search website"].includes(sortMethod.toLowerCase().trim())) {
        let articles = new Map();
        let articlesCount = 0;
        let pageCount = 1;
        // We web scrape and gather at least a 100 articles.
        // Because of how 'locator' is set up, it will only grab around 30 articles per webpage.
        while (articlesCount < 100) {
          // To get 100 pages, we need to go through to around 4 pages and get 120 articles.
            if (pageCount != 1) {
                await page.goto('https://news.ycombinator.com/?p=' + pageCount, {timeout : 10000});
            }
            else if (pageCount > 1 && page == 'https://news.ycombinator.com/newest') {
                console.log("There are less than 100 articles!");
                break;
            };
            pageCount += 1;
            // Here, we get all the article title and set it into a map with the article time for some specific commands.
            const pageArticles = await page.locator(".titleline");
            if (["newest to oldest", "oldest to newest", "a to z", "z to a", "search keyword"].includes(sortMethod.toLowerCase().trim())) {
              // This looks and finds the age attribute and gets where information on that element is.
              const pageTimes = await page.locator('.age');
              const pageArticlesCount = await pageArticles.count();
              for (let i = 0; pageArticlesCount > i; i++) {
                  const articleName = await pageArticles.nth(i).textContent();
                  // For time, we need to cut it to only have the actual date and time for comparisons later.
                  const timeAttribute = await pageTimes.nth(i);
                  const articleTime = await timeAttribute.getAttribute('title');
                  const timeSubstring = articleTime.indexOf(' ');
                  articles.set(articleName, articleTime.substring(0, timeSubstring));
              };
              articlesCount += pageArticlesCount;
            }
            // For authors, we sometimes might not have one, so we need to make sure to skip it.  
            else if (["author from a to z", "author from z to a", "search author"].includes(sortMethod.toLowerCase().trim())) {
              const pageArticlesCount = await pageArticles.count();
              // We need j to be behind i if we skip an article if it does not have an author written.
              for (let i = 0, j = 0; pageArticlesCount > i; i++, j++) {
                const articleName = await pageArticles.nth(i).textContent();
                let articleAuthor = "Unknown";
                if (await page.locator('.hnuser').nth(i).count() > 0) {
                    articleAuthor = await page.locator('.hnuser').nth(j).textContent();
                }
                else {
                  j--;
                };
                articles.set(articleName, articleAuthor);
              }
              articlesCount += pageArticlesCount;
            } 
            // This is the same as authors, but for websites.
            // We gather all of the article names and the websites they are connected to.
            else if (["website from a to z", "website from z to a", "search website"].includes(sortMethod.toLowerCase().trim())) {
              const pageArticlesCount = await pageArticles.count();
              for (let i = 0, j = 0; pageArticlesCount > i; i++, j++) {
                  const articleName = await pageArticles.nth(i).textContent();
                  let articleWebsite = "None";
                  if (await pageArticles.nth(i).locator('.sitestr').count() > 0) {
                      articleWebsite = await await page.locator('.sitestr').nth(j).textContent();
                  }
                  else {
                    j--;
                  };
                  articles.set(articleName, articleWebsite);
              }
              articlesCount += pageArticlesCount;
            }
            // We do the same idea as if we are working with with dates and time, but with upvotes.
            // I set this seperately to avoid making my code too complex, even though it is longer.
            else if (["highest to lowest", "lowest to highest"].includes(sortMethod.toLowerCase().trim())) {
                const pageVotes = await page.locator('.score');
                const pageArticlesCount = await pageArticles.count();
                for (let i = 0; pageArticlesCount > i; i++) {
                    const articleName = await pageArticles.nth(i).textContent();
                    const articleVotes = await pageVotes.nth(i).textContent();
                    const votesSubstring = articleVotes.indexOf(' ');
                    articles.set(articleName, articleVotes.substring(0, votesSubstring));
                };
                articlesCount += pageArticlesCount;
            };
        };
        // We need to cut 20 articles, so we pop them from our map.
        const articlesArray = Array.from(articles)
        for (let i = articlesCount; i <= 100; i--) {
            articlesArray.pop();
        };
        // After turning our map of articles into a 2D array to pop anything over 100, we then turn it back into a map.
        articles = new Map(articlesArray);
        // Below, we check how we want to sort or search, then perform sorting of the map based on those conditions.
        // I had only recieved above the data needed for every sort or search as to speed up performance.
        if (sortMethod.toLowerCase().trim() == "newest to oldest") {
          questionFlag = false;
          label = "Time";
          articlesSorted = new Map([...articles.entries()].sort(([article1, date1], [article2, date2]) => {
            // If the dates are the same, we sort them alphabetically.
            // If those are the same, then they are the exact same and can be in either order.
            if (date1 == date2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // We compare the dates as a Date object.
              return new Date(date2) - new Date(date1);
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "oldest to newest") {
          questionFlag = false;
          label = "Time";
          articlesSorted = new Map([...articles.entries()].sort(([article1, date1], [article2, date2]) => { 
            if (date1 == date2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // Reverse of 'newest to oldest'.
              return new Date(date1) - new Date(date2);
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "a to z") {
          questionFlag = false;
          articlesSorted = new Map([...articles.entries()].sort(([article1, date1], [article2, date2]) => { 
            // If the titles are the same, we sort them by the date.
            if (article1 == article2) {
              return new Date(date2) - new Date(date1);
            }
            else {
              // We compare the names of the articles.
              return article1.localeCompare(article2, undefined, { numeric: true });
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "z to a") {
          questionFlag = false;
          articlesSorted = new Map([...articles.entries()].sort(([article1, date1], [article2, date2]) => { 
              if (article1 == article2) {
                return new Date(date2) - new Date(date1);
              }
              else {
                // Reverse of 'a to z'.
                return article2.localeCompare(article1, undefined, { numeric: true });
              };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "author from a to z") {
          questionFlag = false;
          label = "Author";
          articlesSorted = new Map([...articles.entries()].sort(([article1, author1], [article2, author2]) => { 
            // If the authors are the same, we sort them alphabetically.
            if (author1 == author2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // We compare the names of the authors.
              return author1.localeCompare(author2, undefined, { numeric: true });
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "author from z to a") {
          questionFlag = false;
          label = "Author";
          articlesSorted = new Map([...articles.entries()].sort(([article1, author1], [article2, author2]) => { 
            if (author1 == author2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // Reverse of 'author from a to z'.
              return author2.localeCompare(author1, undefined, { numeric: true });
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "website from a to z") {
          questionFlag = false;
          label = "Website";
          articlesSorted = new Map([...articles.entries()].sort(([article1, domain1], [article2, domain2]) => { 
            // If the website titles are the same, we then sort them alphabetically.
            if (domain1 == domain2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // We compare the names of the websites.
              return domain1.localeCompare(domain2, undefined, { numeric: true });
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "website from z to a") {
          questionFlag = false;
          label = "Website";
          articlesSorted = new Map([...articles.entries()].sort(([article1, domain1], [article2, domain2]) => { 
            if (domain1 == domain2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // Reverse of 'website from a to z'.
              return domain2.localeCompare(domain1, undefined, { numeric: true });
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "highest to lowest") {
          questionFlag = false;
          label = "Votes";
          articlesSorted = new Map([...articles.entries()].sort(([article1, votes1], [article2, votes2]) => { 
            // If upvote count is the same, we then sort them alphabetically.
            if (votes1 == votes2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // We change the counts to integers and then compare.
              return parseInt(votes2) - parseInt(votes1)
            };
          }));
        }
        else if (sortMethod.toLowerCase().trim() == "lowest to highest") {
          questionFlag = false;
          label = "Votes";
          articlesSorted = new Map([...articles.entries()].sort(([article1, votes1], [article2, votes2]) => { 
            if (votes1 == votes2) {
              return article1.localeCompare(article2, undefined, { numeric: true });
            }
            else {
              // Reverse of 'highest to lowest'.
              return parseInt(votes1) - parseInt(votes2)
            };
          }));
        }
        // Here, we perform all of our search methods.
        else if (["search keyword", "search author", "search website"].includes(sortMethod.toLowerCase().trim())) {
          questionFlag = false;
          searchFlag = true;
          // We perform another loop and ask specifically which word, author, or title we want to look for.
          while (searchFlag) {
            let searchMethod = "";
            if (sortMethod.toLowerCase().trim() == "search keyword") {
              label = "Keyword";
              searchMethod = await sortQuestion("Please type a keyword to search for (Type \"Cancel\" to return to options): ");
            }
            // Authors can possibly not exist, so we set that to unknown and can search for those.
            else if (sortMethod.toLowerCase().trim() == "search author") {
              label = "Author";
              searchMethod = await sortQuestion("Please type an author to search for (Type \"Cancel\" to return to option or \"Unknown\" for articles without an author): ");
            }
            // Websites can possibly not be linked, so we can search for any post that is from the website itself.
            else if (sortMethod.toLowerCase().trim() == "search website") {
              label = "Website";
              searchMethod = await sortQuestion("Please type a website to search for (Type \"Cancel\" to return to options or \"None\" for articles without a website): ");
            };
            // If we actually want to sort and not search, we can cancel and return back to the beginning.
            if (searchMethod.toLowerCase().trim() == "cancel") {
              questionFlag = true;
              searchFlag = false;
              // We reset the webpage back to the beginning for when we start our search back up.
              await page.goto('https://news.ycombinator.com/newest');
            }
            else {
              searchFlag = false;
              // If we are searching a keyword, we actually need to return the keyword itself instead of the time that is mapped as a value to our key, the article title.
              if (sortMethod.toLowerCase().trim() == "search keyword") {
                articles.forEach((value, articleName) => {
                  articleNameSplit = articleName.toLowerCase().trim().split(" ");
                  if (articleNameSplit.includes(searchMethod.toLowerCase().trim())) {
                    matchingSearch.push({articleName, searchMethod});
                  };
                });
              }
              // This will create a list of all articles and values that match the searched string.
              else {
                articles.forEach((value, articleName) => {
                  valueSplit = value.toLowerCase().trim().split(" ");
                  if (valueSplit.includes(searchMethod.toLowerCase().trim())) {
                    matchingSearch.push({value, articleName});
                  };
                });
              };
            };
          };
        };
    }
    // If something else is typed that is not one of the options, we reset and ask the question again.
    else {
        console.log(`${sortMethod} is not an option. Please try again!\n`);
    };
    // Once we exit our loop, we start to print the article and it's value we are sorting by or searching.
    if (!questionFlag) {
        // This performs for everything except searching and sorting alphabetically.
        if (sortMethod.toLowerCase().trim() != "a to z" && sortMethod.toLowerCase().trim() != "z to a" && !(["search keyword", "search author", "search website"].includes(sortMethod.toLowerCase().trim()))) {
            for (let i = 0; 100 > i; i++) {
                var key = Array.from(articlesSorted.keys())[i];
                var value = articlesSorted.get(key);
                console.log(`${i + 1}. \"${key}\"\n${label}: ${value}\n`);
            };
        }
        else if (["search keyword", "search author", "search website"].includes(sortMethod.toLowerCase().trim())) {
          // If there are results, we print them here based on if we want the keyword given to search, or the values we searched.
          if (matchingSearch.length > 0) {
            if (sortMethod.toLowerCase().trim() == "search keyword") {
              for (let i = 0; matchingSearch.length > i; i++) {
                console.log(`${i + 1}. \"${matchingSearch[i].articleName}\"\n${label}: ${matchingSearch[i].searchMethod}\n`);
              };
            }
            else {
              for (let i = 0; matchingSearch.length > i; i++) {
                console.log(`${i + 1}. \"${matchingSearch[i].articleName}\"\n${label}: ${matchingSearch[i].value}\n`);
              };
            };
          }
          // If there are no results, we print a message saying nothing was found.
          else {
            console.log("Unfortanately, no results matched your search!\n")
          };
        }
        // For printing alphabetically, we only need the title, so it prints a bit differently.
        else {
            for (let i = 0; 100 > i; i++) {
                var key = Array.from(articlesSorted.keys())[i];
                console.log(`${i + 1}. \"${key}\"\n`);
            };
        };
        // We close readline.
        rl.close();
    };
  };
  // We close our browser as it is no longer needed.
  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
})();