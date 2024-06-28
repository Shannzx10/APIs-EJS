const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const crypto = require('crypto');

function uuid() {
  let d = new Date().getTime();
  let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function generateRandomString(length) {
    const characters = 'abcdef0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateRandomNumberString(length) {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function getSearchResults(query) {
    const url = 'https://aoyo.ai/Api/AISearch/Source';
    const requestData = {
        q: query,
        num: 20,
        hl: 'id-ID'
    };

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*'
    };

    try {
        const response = await axios.post(url, qs.stringify(requestData), { headers });
        return response.data.organic;
    } catch (error) {
        return [];
    }
}

async function AoyoAi(content) {
    const searchQuery = content;
    const searchResults = await getSearchResults(searchQuery);

    const engineContent = searchResults.map((result, index) => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        sitelinks: result.sitelinks ? result.sitelinks.map(link => ({
            title: link.title,
            link: link.link
        })) : [],
        position: index + 1
    }));

    const url = 'https://aoyo.ai/Api/AISearch/AISearch';
    const requestData = {
        content: content,
        id: generateRandomString(32),
        language: 'id-ID',
        engineContent: JSON.stringify(engineContent),
        randomNumber: generateRandomNumberString(17)
    };

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://aoyo.ai/search/?q=' + encodeURIComponent(content)
    };

    try {
        const response = await axios.post(url, qs.stringify(requestData), { headers });
        return response.data.replace(/\[START\][\s\S]*$/g, '').trim();

    } catch (error) {
        return { error: error.message };
    }
}

async function tudouai(q, p) {
  try {
    const authResponse = await axios.post('https://tudouai.chat/api/auth/nick_login', {
      fingerprint: crypto.randomBytes(16).toString('hex')
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://tudouai.chat/chat'
      }
    });
    
    const chatResponse = await axios.post('https://tudouai.chat/api/v1/chat/completions', {
      model: "gpt-3.5-turbo-0125",
      messages: [
        { role: "system", content: p },
        { role: "user", content: q }
      ],
      stream: true
    }, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': authResponse.data.token
      },
      responseType: 'stream'
    });
    let content = '';
    return new Promise((resolve, reject) => {
      chatResponse.data.on('data', chunk => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          if (line === 'data: [DONE]') {
            resolve(content);
          } else {
            try {
              const parsed = JSON.parse(line.replace(/^data: /, ''));
              const delta = parsed.choices[0].delta;
              if (delta && delta.content) {
                content += delta.content;
              }
            } catch (error) {
              reject(error);
            }
          }
        }
      });
      chatResponse.data.on('end', () => resolve(content));
      chatResponse.data.on('error', error => reject(error));
    });

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

const axiosInstance = axios.create({
  baseURL: 'https://gke-prod-api.useadrenaline.com/',
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'x-instance': 'adrenaline'
  }
});

async function useadrenaline(q) {
  try {
    const data = {
      title: q,
      body: "",
      snippets: [],
      is_rush_enabled: false,
      is_public: false,
      files: []
    };
    const { data: postResponseData } = await axiosInstance.post('question', data);
    const { data: threadResponseData } = await axiosInstance.get(`thread/${postResponseData.question_id}?page=1&per_page=10`);
    let jobStatus = 'IN_PROGRESS';
    let dataHasil = null;
    while (jobStatus === 'IN_PROGRESS') {
      const { data: answersResponseData } = await axiosInstance.get(`question/${threadResponseData.list[0].question.id}/answers`);
      jobStatus = answersResponseData[0].job_status;
      dataHasil = answersResponseData[0].content;

      if (jobStatus === 'IN_PROGRESS') {
        console.log('Job is still in progress...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return dataHasil;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function LetmeGpt(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://letmegpt.com/search?q=${encodedQuery}`;

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    return $('#gptans').text();
  } catch (error) {
    console.log('Error:', error);
    return null;
  }
}

const website = axios.create({
  baseURL: 'https://app.yoursearch.ai',
  headers: {
    'Content-Type': 'application/json'
  }
});

const yousearch = async (searchTerm) => {
  const requestData = {
    searchTerm: searchTerm,
    promptTemplate: `Search term: "{searchTerm}"

Make your language less formal and use emoticons.
I want you to always use Indonesian slang from Jakarta where the words "you" and "anda" are replaced with "lu" and the word I is replaced with "gw".
Create a summary of the search results in three paragraphs with reference numbers, which you then list numbered at the bottom.
Include emojis in the summary.
Be sure to include the reference numbers in the summary.
Both in the text of the summary and in the reference list, the reference numbers should look like this: "(1)".
Formulate simple sentences.
Include blank lines between the paragraphs.
Do not reply with an introduction, but start directly with the summary.
Include emojis in the summary.
At the end write a hint text where I can find search results as comparison with the above search term with a link to Google search in this format \`See Google results: \` and append the link.
Below write a tip how I can optimize the search results for my search query.
I show you in which format this should be structured:

\`\`\`
<Summary of search results with reference numbers>

Sources:
(1) <URL of the first reference>
(2) <URL of the second reference>

<Hint text for further search results with Google link>
<Tip>
\`\`\`

Here are the search results:
{searchResults}`,
    searchParameters: "{}",
    searchResultTemplate: `[{order}] "{snippet}"
URL: {link}`
  };

  try {
    const response = await website.post('/api', requestData);
    return response.data.response;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

function generateRandomID(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let randomID = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomID += characters.charAt(randomIndex);
  }
  return randomID;
}

const api = axios.create({
  baseURL: 'https://search.lepton.run/api/',
  headers: {
    'Content-Type': 'application/json'
  }
});

async function leptonAi(query) {
  try {
    const rid = generateRandomID(10);
    const postData = { query, rid };
    const response = await api.post('query', postData);
    
    const llmResponseRegex = /__LLM_RESPONSE__([\s\S]*?)__RELATED_QUESTIONS__/;
    const llmResponseMatch = response.data.match(llmResponseRegex);

    if (llmResponseMatch && llmResponseMatch[1]) {
      let llmResponse = llmResponseMatch[1].trim();
      llmResponse = llmResponse.replace(/__LLM_RESPONSE__|__RELATED_QUESTIONS__/g, '').trim();
      return llmResponse;
    } else {
      throw new Error("No LLM response found.");
    }
  } catch (error) {
    throw new Error('Error fetching LLM response: ' + error.message);
  }
}

async function Simsimi(text) {
  const url = 'https://simsimi.vn/web/simtalk';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    Referer: 'https://simsimi.vn/'
  };

  try {
    const response = await axios.post(url, `text=${encodeURIComponent(text)}&lc=id`, { headers });
    return response.data.success;
  } catch (error) {
    console.error('Error asking SimSimi:', error);
    throw error;
  }
}

async function CgtAi(text) {
  try {
    const conversation_uuid = uuid();

    const requestData = {
      conversation_uuid: conversation_uuid,
      text: text,
      sent_messages: 1
    };

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    const response = await axios.post('https://www.timospecht.de/wp-json/cgt/v1/chat', qs.stringify(requestData), config);
    return response.data;
  } catch (error) {
    throw new Error('Terjadi kesalahan:', error);
  }
}

async function blackbox(prompt) {
  try {
    const response = await axios.post('https://www.blackbox.ai/api/chat', {
      messages: [{
        id: uuid(),
        content: prompt,
        role: 'user'
      }],
      id: uuid(),
      previewToken: null,
      userId: '47b37fe9-1ac9-4097-a719-2cc1a0729b10',
      codeModelMode: true,
      agentMode: {},
      trendingAgentMode: {},
      isMicMode: false,
      isChromeExt: false,
      githubToken: null,
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: null
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    })
    let result = response.data
    result = result.replace(/\$@v=v1\.10-rv2\$@\$/g, '')
    .replace(/Sources:.*/g, '')
    .replace(/$/g, '')
    const content = result.match(/content":"(.*?)"/)
    return content
  } catch (error) {
    console.error(error)
    throw error
  }
}

async function luminai(q) {
    try {
        const response = await axios.post("https://luminai.siputzx.my.id/", {
            content: q
        });
        return response.data.result;
    } catch (error) {
        console.error('Error fetching:', error);
        throw error;
    }
}

luminai("question")
    .then(result => {
        return('Result:', result);
    })
    .catch(error => {
        return('Error:', error);
    });

async function GoodyAI(q) {
  try {
    const headers = {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7,af;q=0.6',
      'Content-Type': 'application/json',
      'Origin': 'https://www.goody2.ai',
      'Referer': 'https://www.goody2.ai/chat',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    };

    const params = {
      message: q,
      debugParams: null
    };

    const response = await axios.post("https://www.goody2.ai/send", params, {
      headers,
      responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
      let fullText = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (let line of lines) {
          if (line.startsWith('data: {"content":')) {
            try {
              const content = JSON.parse(line.slice(6)).content;
              fullText += content;
            } catch (err) {
              console.error('Error parsing JSON:', err);
            }
          }
        }
      });

      response.data.on('end', () => {
        resolve(fullText);
      });

      response.data.on('error', (err) => {
        reject(err);
      });
    });

  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function thinkany(prompt) {
  try {
    const response = await axios.post('https://thinkany.ai/api/chat',
      {
        role: 'user',
        content: prompt,
        conv_uuid: uuid(),
        mode: 'search',
        is_new: true,
        model: 'claude-3-haiku'
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = { thinkany, tudouai, useadrenaline, GoodyAI, luminai, blackbox, CgtAi, Simsimi, leptonAi, yousearch, LetmeGpt, AoyoAi };