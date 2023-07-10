const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const getGitHubIssues = async () => {
    try {
        const baseUrl = 'https://github.com/frontendbr/vagas/issues?page=';
        const queryParam = '&q=';
        let currentPage = 1;
        let hasNextPage = true;

        // Array to store the issues data
        const issuesData = [];

        while (hasNextPage) {
            // Fetch the HTML for the current page
            const url = baseUrl + currentPage + queryParam;
            console.log(`Scraping page ${url}...`);
            const response = await axios.get(url);
            console.log(`Received a response for page ${url}`);
            const html = response.data;
            const $ = cheerio.load(html);

            // Find all issue links
            const issueLinks = $('a[id^="issue_"]').map((index, element) => $(element).attr('href')).get();

            // Process each issue link
            for (const link of issueLinks) {
                // Fetch the HTML for the issue page
                const issueUrl = `https://github.com${link}`;
                console.log('\n');
                console.log(`Scraping issue ${issueUrl}...`);
                const issueResponse = await axios.get(issueUrl);
                console.log(`Received a response for issue ${issueUrl}`);
                console.log('\n');
                const issueHtml = issueResponse.data;
                const $issue = cheerio.load(issueHtml);

                // Extract the issue title
                const titleIssue = $issue('.js-issue-title').text().trim().split('\n')[0];

                // Extract the issue number from the link
                const issueId = link.split('/').pop();

                // Skip issues with the name "Touring"
                if (titleIssue.toLowerCase().includes('turing')) {
                    continue;
                }

                console.log(`Issue: ${titleIssue}`);
                console.log(`Issue ID: ${issueId}`);

                // Extract email addresses from the issue comments' bodies
                const emailAddresses = $issue('.comment-body a[href^="mailto:"]').map((index, element) => $(element).text().trim()).get();

                // Extract tags from the issue
                const tags = $issue('.IssueLabel').map((index, element) => $(element).text().trim()).get();

                // Filter and get unique tags
                const uniqueTags = [...new Set(tags)];

                // Create an object for the current issue
                const issueData = {
                    id: issueId,
                    url: issueUrl,
                    title_issue: titleIssue,
                    email_addresses: emailAddresses,
                    tags: uniqueTags,
                };

                // Add the issue data to the array
                issuesData.push(issueData);
                // console.log('-------------------------------------------------------------');
                console.log(`Email addresses: ${emailAddresses.join(', ')}`);
                console.log(`Tags: ${uniqueTags.join(', ')}`);
                console.log(`Link: ${issueUrl}`);
                console.log('-------------------------------------------------------------');
            }

            console.log('\n');
            console.log(`Scraped page ${url}`);

            // Check if "Next" button exists
            const nextPageLink = $('.next_page');
            hasNextPage = nextPageLink.length > 0;

            if (hasNextPage) {
                // Increment the current page counter
                currentPage++;
            }

            // Wait for a short delay before scraping the next page (optional)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Convert the issues data to JSON
        const json_data = JSON.stringify(issuesData, null, 2);

        // Save the JSON data to a file
        fs.writeFileSync('issues_data.json', json_data);

        console.log('Data saved to issues_data.json');
    } catch (error) {
        console.error('Error:', error);
    }
};

getGitHubIssues();
