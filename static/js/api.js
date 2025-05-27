// AJAX wrapper
const fetchData = async (url, options = {}, txt) => {
    try {
        showLoader(txt);
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        hideLoader();
        return await response.json();
    } catch (error) {
        //showError(`Failed to fetch data: ${error.message}`);
        hideLoader();
        throw error;
    }
};

// API Call functionality
function addHeader() {
    const headersDiv = document.getElementById('api-headers');
    const headerRow = document.createElement('div');
    headerRow.className = 'row mb-2';
    headerRow.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Key" name="header-key">
        </div>
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Value" name="header-value">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger" onclick="removeHeader(this)">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
    headersDiv.appendChild(headerRow);
}

function removeHeader(button) {
    button.closest('.row').remove();
}

function addParam() {
    const paramsDiv = document.getElementById('api-params');
    const paramRow = document.createElement('div');
    paramRow.className = 'row mb-2';
    paramRow.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Key" name="param-key">
        </div>
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Value" name="param-value">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger" onclick="removeParam(this)">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
    paramsDiv.appendChild(paramRow);
}

function removeParam(button) {
    button.closest('.row').remove();
}

function getHeaders() {
    const headers = {};
    const headerRows = document.querySelectorAll('#api-headers .row');
    headerRows.forEach(row => {
        const key = row.querySelector('[name="header-key"]').value.trim();
        const value = row.querySelector('[name="header-value"]').value.trim();
        if (key && value) {
            headers[key] = value;
        }
    });
    return headers;
}

function getParams() {
    const params = {};
    const paramRows = document.querySelectorAll('#api-params .row');
    paramRows.forEach(row => {
        const key = row.querySelector('[name="param-key"]').value.trim();
        const value = row.querySelector('[name="param-value"]').value.trim();
        if (key && value) {
            params[key] = value;
        }
    });
    return params;
}

function buildUrl(baseUrl, params) {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });
    return url.toString();
}

function updateBodyInput() {
    const bodyType = document.getElementById('body-type').value;
    document.querySelectorAll('.body-input').forEach(input => {
        input.style.display = 'none';
    });
    
    if (bodyType !== 'none') {
        document.getElementById(`${bodyType}-body`).style.display = 'block';
    }
}

function addFormData() {
    const fieldsDiv = document.getElementById('form-data-fields');
    const fieldRow = document.createElement('div');
    fieldRow.className = 'row mb-2';
    fieldRow.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Key" name="form-data-key">
        </div>
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Value" name="form-data-value">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger" onclick="removeFormData(this)">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
    fieldsDiv.appendChild(fieldRow);
}

function removeFormData(button) {
    button.closest('.row').remove();
}

function addUrlEncoded() {
    const fieldsDiv = document.getElementById('urlencoded-fields');
    const fieldRow = document.createElement('div');
    fieldRow.className = 'row mb-2';
    fieldRow.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Key" name="urlencoded-key">
        </div>
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Value" name="urlencoded-value">
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger" onclick="removeUrlEncoded(this)">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `;
    fieldsDiv.appendChild(fieldRow);
}

function removeUrlEncoded(button) {
    button.closest('.row').remove();
}

function getFormData() {
    const formData = {};
    const fields = document.querySelectorAll('#form-data-fields .row');
    fields.forEach(field => {
        const key = field.querySelector('[name="form-data-key"]').value.trim();
        const value = field.querySelector('[name="form-data-value"]').value.trim();
        if (key && value) {
            formData[key] = value;
        }
    });
    return formData;
}

function getUrlEncoded() {
    const urlEncoded = {};
    const fields = document.querySelectorAll('#urlencoded-fields .row');
    fields.forEach(field => {
        const key = field.querySelector('[name="urlencoded-key"]').value.trim();
        const value = field.querySelector('[name="urlencoded-value"]').value.trim();
        if (key && value) {
            urlEncoded[key] = value;
        }
    });
    return urlEncoded;
}

async function makeApiCall() {
    const method = document.getElementById('api-method').value;
    const baseUrl = document.getElementById('api-url').value;
    const bodyType = document.getElementById('body-type').value;
    const headers = getHeaders();
    const params = getParams();

    if (!baseUrl) {
        showError('Please enter a URL');
        return;
    }

    const url = buildUrl(baseUrl, params);
    const options = {
        method,
        headers: {
            ...headers
        }
    };

    // Handle different body types
    if (bodyType !== 'none' && (method === 'POST' || method === 'PUT')) {
        switch (bodyType) {
            case 'json':
                const jsonBody = document.getElementById('api-body-json').value;
                if (jsonBody) {
                    try {
                        options.body = JSON.stringify(JSON.parse(jsonBody));
                        options.headers['Content-Type'] = 'application/json';
                    } catch (e) {
                        showError('Invalid JSON in request body');
                        return;
                    }
                }
                break;

            case 'form-data':
                const formData = getFormData();
                if (Object.keys(formData).length > 0) {
                    const formDataObj = new FormData();
                    Object.entries(formData).forEach(([key, value]) => {
                        formDataObj.append(key, value);
                    });
                    options.body = formDataObj;
                    // Don't set Content-Type header for FormData, browser will set it automatically
                }
                break;

            case 'x-www-form-urlencoded':
                const urlEncoded = getUrlEncoded();
                if (Object.keys(urlEncoded).length > 0) {
                    options.body = new URLSearchParams(urlEncoded).toString();
                    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
                break;

            case 'raw':
                const rawBody = document.getElementById('api-body-raw').value;
                const rawContentType = document.getElementById('raw-content-type').value;
                if (rawBody) {
                    options.body = rawBody;
                    options.headers['Content-Type'] = rawContentType;
                }
                break;

            case 'binary':
                const fileInput = document.getElementById('api-body-binary');
                if (fileInput.files.length > 0) {
                    options.body = fileInput.files[0];
                    // Don't set Content-Type header for binary, browser will set it automatically
                }
                break;

            case 'graphql':
                const query = document.getElementById('api-body-graphql-query').value;
                const variables = document.getElementById('api-body-graphql-variables').value;
                if (query) {
                    try {
                        const graphqlBody = {
                            query,
                            variables: variables ? JSON.parse(variables) : undefined
                        };
                        options.body = JSON.stringify(graphqlBody);
                        options.headers['Content-Type'] = 'application/json';
                    } catch (e) {
                        showError('Invalid GraphQL variables JSON');
                        return;
                    }
                }
                break;
        }
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.text();
        let responseBody;
        try {
            responseBody = JSON.parse(responseData);
        } catch {
            responseBody = responseData;
        }

        // Record the response
        const recordResponse = await fetch('/_record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                method,
                url: baseUrl,
                variables: {},  // Add if needed
                headers,
                params,
                body: options.body,
                body_type: bodyType
            })
        });

        if (!recordResponse.ok) {
            throw new Error('Failed to record response');
        }

        // Display the response
        document.getElementById('api-response').style.display = 'block';
        document.getElementById('response-status').textContent = `${response.status} ${response.statusText}`;
        document.getElementById('response-headers').textContent = JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2);
        document.getElementById('response-body').textContent = JSON.stringify(responseBody, null, 2);

    } catch (error) {
        showError(error.message);
    }
}

function createImposterFromResponse() {
    const method = document.getElementById('api-method').value;
    const url = new URL(document.getElementById('api-url').value);
    const path = url.pathname;
    const params = getParams();
    const headers = getHeaders();
    const bodyType = document.getElementById('body-type').value;
    let body;

    // Get body based on body type
    switch (bodyType) {
        case 'json':
            body = document.getElementById('api-body-json').value;
            break;
        case 'form-data':
            body = getFormData();
            break;
        case 'x-www-form-urlencoded':
            body = getUrlEncoded();
            break;
        case 'raw':
            body = document.getElementById('api-body-raw').value;
            break;
        case 'graphql':
            body = {
                query: document.getElementById('api-body-graphql-query').value,
                variables: document.getElementById('api-body-graphql-variables').value
            };
            break;
        default:
            body = null;
    }

    const imposterData = {
        name: `Imposter for ${path}`,
        description: `Auto-generated imposter for ${method} ${path}`,
        predicates: [{
            method: method,
            path: path,
            query: params,
            headers: headers,
            body: body
        }],
        responses: [{
            statusCode: parseInt(document.getElementById('response-status').textContent.split(' ')[0]),
            headers: JSON.parse(document.getElementById('response-headers').textContent),
            body: JSON.parse(document.getElementById('response-body').textContent)
        }]
    };

    // Show the create imposter modal with pre-filled data
    showCreateImposterModal(imposterData);
}

// Reset all API call fields to their default state
function resetApiCallFields() {
    // Reset method and URL
    document.getElementById('api-method').value = 'GET';
    document.getElementById('api-url').value = '';

    // Reset headers
    const headersDiv = document.getElementById('api-headers');
    headersDiv.innerHTML = `
        <div class="row mb-2">
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Key" name="header-key">
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Value" name="header-value">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger" onclick="removeHeader(this)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Reset parameters
    const paramsDiv = document.getElementById('api-params');
    paramsDiv.innerHTML = `
        <div class="row mb-2">
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Key" name="param-key">
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Value" name="param-value">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger" onclick="removeParam(this)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Reset body type and all body inputs
    document.getElementById('body-type').value = 'none';
    document.getElementById('api-body-json').value = '';
    document.getElementById('api-body-raw').value = '';
    document.getElementById('api-body-binary').value = '';
    document.getElementById('api-body-graphql-query').value = '';
    document.getElementById('api-body-graphql-variables').value = '';

    // Reset form data fields
    const formDataFields = document.getElementById('form-data-fields');
    formDataFields.innerHTML = `
        <div class="row mb-2">
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Key" name="form-data-key">
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Value" name="form-data-value">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger" onclick="removeFormData(this)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Reset URL encoded fields
    const urlEncodedFields = document.getElementById('urlencoded-fields');
    urlEncodedFields.innerHTML = `
        <div class="row mb-2">
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Key" name="urlencoded-key">
            </div>
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Value" name="urlencoded-value">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger" onclick="removeUrlEncoded(this)">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    // Hide response section
    document.getElementById('api-response').style.display = 'none';

    // Update body input visibility
    updateBodyInput();
}

// Show the API call section
function showApiCallSection() {
    switchMainContent("api");
    resetApiCallFields();
}

// Add API Call button to the welcome section
document.addEventListener('DOMContentLoaded', () => {
    const welcomeSection = document.getElementById('welcome-section');
    const apiCallButton = document.createElement('button');
    apiCallButton.className = 'btn btn-purple mt-2';
    apiCallButton.innerHTML = '<i class="fa-solid fa-code"></i> Record API Response';
    apiCallButton.onclick = showApiCallSection;
    welcomeSection.appendChild(apiCallButton);
});