// Global state
let impostersData = [];

// UI Management
function switchMainContent(force_content) {
    const predicateSection = document.getElementById('main-content');
    const testSection = document.getElementById('main-content-test');
    const apiSection = document.getElementById('main-content-api');

    // Hide all sections first
    predicateSection.style.display = "none";
    testSection.style.display = "none";
    apiSection.style.display = "none";

    // Show the requested section
    if (force_content === "test") {
        testSection.style.display = "block";
    } else if (force_content === "api") {
        apiSection.style.display = "block";
    } else {
        predicateSection.style.display = "block";
    }
}

function showPredicates(index) {
    switchMainContent("main");
    const welcomeSection = document.getElementById('welcome-section');
    const predicateSection = document.getElementById('predicate-section');
    
    if (index === undefined || index === null) {
        welcomeSection.style.display = 'flex';
        predicateSection.style.display = 'none';
        return;
    }

    const imposter = impostersData[index];
    if (!imposter) {
        welcomeSection.style.display = 'flex';
        predicateSection.style.display = 'none';
        return;
    }

    welcomeSection.style.display = 'none';
    predicateSection.style.display = 'block';
    
    const title = document.getElementById('selected-imposter-title');
    const list = document.getElementById('predicate-list');

    // Update title to show name and description in separate lines
    title.innerHTML = `
        <div class="imposter-name">
            ${imposter.imposter.name}
            <button class="btn btn-danger delete-imposter" data-index="${index}">
                 <i class="fa-solid fa-trash"></i>
                 &nbsp;Delete
            </button>
        </div>
        <div class="imposter-description text-muted">${imposter.imposter.description || 'No description'}</div>
    `;
    list.innerHTML = '';

    if (imposter.predicates.length === 0) {
        list.innerHTML = '<li class="list-group-item py-3 px-3">No predicates found.</li>';
        setupImposterListeners(imposter, index);
        return;
    }

    // Create accordion for predicates
    const accordion = document.createElement('div');
    accordion.className = 'accordion';
    accordion.id = 'predicatesAccordion';

    imposter.predicates.forEach((p, idx) => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        // Create accordion header
        const header = document.createElement('h2');
        header.className = 'accordion-header';
        header.id = `heading${idx}`;
        
        const button = document.createElement('button');
        button.className = 'accordion-button collapsed';
        button.type = 'button';
        button.setAttribute('data-bs-toggle', 'collapse');
        button.setAttribute('data-bs-target', `#collapse${idx}`);
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', `collapse${idx}`);
        
        // Add edit and delete buttons to header
        const headerContent = document.createElement('div');
        headerContent.className = 'd-flex justify-content-between align-items-center w-100';
        headerContent.innerHTML = `
            <span><strong class="text-border color-${p.method}">${p.method}</strong> ${p.path}</span>
        `;
        button.appendChild(headerContent);
        
        header.appendChild(button);
        
        // Create accordion body
        const collapse = document.createElement('div');
        collapse.id = `collapse${idx}`;
        collapse.className = 'accordion-collapse collapse';
        collapse.setAttribute('aria-labelledby', `heading${idx}`);
        collapse.setAttribute('data-bs-parent', '#predicatesAccordion');
        
        const body = document.createElement('div');
        body.className = 'accordion-body';

        let delayDisplay = p.delay || 'Not set';

        let details = `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <label class="form-label"><strong>Method:</strong></label>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-purple edit-predicate" data-index="${idx}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-predicate" data-index="${idx}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="predicate-field" data-field="method" data-index="${idx}">
                    <div class="predicate-text">${p.method || 'Not set'}</div>
                    <select class="form-select predicate-input" style="width: 25%; display: none;">
                        <option value="GET" ${p.method === 'GET' ? 'selected' : ''}>GET</option>
                        <option value="POST" ${p.method === 'POST' ? 'selected' : ''}>POST</option>
                        <option value="PUT" ${p.method === 'PUT' ? 'selected' : ''}>PUT</option>
                        <option value="DELETE" ${p.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
                    </select>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label"><strong>Path:</strong></label>
                <div class="predicate-field" data-field="path" data-index="${idx}">
                    <div class="predicate-text">${p.path || 'Not set'}</div>
                    <input type="text" class="form-control predicate-input" value="${p.path || ''}" style="width: 25%; display: none;">
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label"><strong>Delay:</strong></label>
                <div class="predicate-field" data-field="delay" data-index="${idx}">
                    <div class="predicate-text">${delayDisplay}</div>
                    <div class="predicate-input" style="display: none;">
                        <div class="input-group" style="width: 25%;">
                            <input type="number" class="form-control" value="${p.delay ? p.delay.replace(/[^0-9]/g, '') : '0'}" min="0">
                            <select class="form-select" style="width: auto;">
                                <option value="ms" ${p.delay?.endsWith('ms') ? 'selected' : ''}>ms</option>
                                <option value="s" ${p.delay?.endsWith('s') && !p.delay?.endsWith('ms') ? 'selected' : ''}>s</option>
                                <option value="m" ${p.delay?.endsWith('m') ? 'selected' : ''}>m</option>
                                <option value="h" ${p.delay?.endsWith('h') || p.delay?.endsWith('hr') ? 'selected' : ''}>h</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label"><strong>Force Response:</strong></label>
                <div class="predicate-field" data-field="force_response" data-index="${idx}">
                    <div class="predicate-text">${p.force_response || 'Not set'}</div>
                    <select class="form-select predicate-input" style="width: 25%; display: none;">
                        <option value="">Select Status Code</option>
                        <optgroup label="1xx Informational">
                            <option value="100" ${p.force_response === 100 ? 'selected' : ''}>100 Continue</option>
                            <option value="101" ${p.force_response === 101 ? 'selected' : ''}>101 Switching Protocols</option>
                            <option value="102" ${p.force_response === 102 ? 'selected' : ''}>102 Processing</option>
                            <option value="103" ${p.force_response === 103 ? 'selected' : ''}>103 Early Hints</option>
                        </optgroup>
                        <optgroup label="2xx Success">
                            <option value="200" ${p.force_response === 200 ? 'selected' : ''}>200 OK</option>
                            <option value="201" ${p.force_response === 201 ? 'selected' : ''}>201 Created</option>
                            <option value="202" ${p.force_response === 202 ? 'selected' : ''}>202 Accepted</option>
                            <option value="203" ${p.force_response === 203 ? 'selected' : ''}>203 Non-Authoritative Information</option>
                            <option value="204" ${p.force_response === 204 ? 'selected' : ''}>204 No Content</option>
                            <option value="205" ${p.force_response === 205 ? 'selected' : ''}>205 Reset Content</option>
                            <option value="206" ${p.force_response === 206 ? 'selected' : ''}>206 Partial Content</option>
                            <option value="207" ${p.force_response === 207 ? 'selected' : ''}>207 Multi-Status</option>
                            <option value="208" ${p.force_response === 208 ? 'selected' : ''}>208 Already Reported</option>
                            <option value="226" ${p.force_response === 226 ? 'selected' : ''}>226 IM Used</option>
                        </optgroup>
                        <optgroup label="3xx Redirection">
                            <option value="300" ${p.force_response === 300 ? 'selected' : ''}>300 Multiple Choices</option>
                            <option value="301" ${p.force_response === 301 ? 'selected' : ''}>301 Moved Permanently</option>
                            <option value="302" ${p.force_response === 302 ? 'selected' : ''}>302 Found</option>
                            <option value="303" ${p.force_response === 303 ? 'selected' : ''}>303 See Other</option>
                            <option value="304" ${p.force_response === 304 ? 'selected' : ''}>304 Not Modified</option>
                            <option value="305" ${p.force_response === 305 ? 'selected' : ''}>305 Use Proxy</option>
                            <option value="307" ${p.force_response === 307 ? 'selected' : ''}>307 Temporary Redirect</option>
                            <option value="308" ${p.force_response === 308 ? 'selected' : ''}>308 Permanent Redirect</option>
                        </optgroup>
                        <optgroup label="4xx Client Errors">
                            <option value="400" ${p.force_response === 400 ? 'selected' : ''}>400 Bad Request</option>
                            <option value="401" ${p.force_response === 401 ? 'selected' : ''}>401 Unauthorized</option>
                            <option value="402" ${p.force_response === 402 ? 'selected' : ''}>402 Payment Required</option>
                            <option value="403" ${p.force_response === 403 ? 'selected' : ''}>403 Forbidden</option>
                            <option value="404" ${p.force_response === 404 ? 'selected' : ''}>404 Not Found</option>
                            <option value="405" ${p.force_response === 405 ? 'selected' : ''}>405 Method Not Allowed</option>
                            <option value="406" ${p.force_response === 406 ? 'selected' : ''}>406 Not Acceptable</option>
                            <option value="407" ${p.force_response === 407 ? 'selected' : ''}>407 Proxy Authentication Required</option>
                            <option value="408" ${p.force_response === 408 ? 'selected' : ''}>408 Request Timeout</option>
                            <option value="409" ${p.force_response === 409 ? 'selected' : ''}>409 Conflict</option>
                            <option value="410" ${p.force_response === 410 ? 'selected' : ''}>410 Gone</option>
                            <option value="411" ${p.force_response === 411 ? 'selected' : ''}>411 Length Required</option>
                            <option value="412" ${p.force_response === 412 ? 'selected' : ''}>412 Precondition Failed</option>
                            <option value="413" ${p.force_response === 413 ? 'selected' : ''}>413 Payload Too Large</option>
                            <option value="414" ${p.force_response === 414 ? 'selected' : ''}>414 URI Too Long</option>
                            <option value="415" ${p.force_response === 415 ? 'selected' : ''}>415 Unsupported Media Type</option>
                            <option value="416" ${p.force_response === 416 ? 'selected' : ''}>416 Range Not Satisfiable</option>
                            <option value="417" ${p.force_response === 417 ? 'selected' : ''}>417 Expectation Failed</option>
                            <option value="418" ${p.force_response === 418 ? 'selected' : ''}>418 I'm a teapot</option>
                            <option value="421" ${p.force_response === 421 ? 'selected' : ''}>421 Misdirected Request</option>
                            <option value="422" ${p.force_response === 422 ? 'selected' : ''}>422 Unprocessable Entity</option>
                            <option value="423" ${p.force_response === 423 ? 'selected' : ''}>423 Locked</option>
                            <option value="424" ${p.force_response === 424 ? 'selected' : ''}>424 Failed Dependency</option>
                            <option value="425" ${p.force_response === 425 ? 'selected' : ''}>425 Too Early</option>
                            <option value="426" ${p.force_response === 426 ? 'selected' : ''}>426 Upgrade Required</option>
                            <option value="428" ${p.force_response === 428 ? 'selected' : ''}>428 Precondition Required</option>
                            <option value="429" ${p.force_response === 429 ? 'selected' : ''}>429 Too Many Requests</option>
                            <option value="431" ${p.force_response === 431 ? 'selected' : ''}>431 Request Header Fields Too Large</option>
                            <option value="451" ${p.force_response === 451 ? 'selected' : ''}>451 Unavailable For Legal Reasons</option>
                        </optgroup>
                        <optgroup label="5xx Server Errors">
                            <option value="500" ${p.force_response === 500 ? 'selected' : ''}>500 Internal Server Error</option>
                            <option value="501" ${p.force_response === 501 ? 'selected' : ''}>501 Not Implemented</option>
                            <option value="502" ${p.force_response === 502 ? 'selected' : ''}>502 Bad Gateway</option>
                            <option value="503" ${p.force_response === 503 ? 'selected' : ''}>503 Service Unavailable</option>
                            <option value="504" ${p.force_response === 504 ? 'selected' : ''}>504 Gateway Timeout</option>
                            <option value="505" ${p.force_response === 505 ? 'selected' : ''}>505 HTTP Version Not Supported</option>
                            <option value="506" ${p.force_response === 506 ? 'selected' : ''}>506 Variant Also Negotiates</option>
                            <option value="507" ${p.force_response === 507 ? 'selected' : ''}>507 Insufficient Storage</option>
                            <option value="508" ${p.force_response === 508 ? 'selected' : ''}>508 Loop Detected</option>
                            <option value="510" ${p.force_response === 510 ? 'selected' : ''}>510 Not Extended</option>
                            <option value="511" ${p.force_response === 511 ? 'selected' : ''}>511 Network Authentication Required</option>
                        </optgroup>
                    </select>
                </div>
            </div>
        `;
        
        // Add responses
        if (p.responses && p.responses.length > 0) {
            details += '<div class="mt-3"><strong>Responses:</strong></div>';
            p.responses.forEach((resp, respIdx) => {
                // Set default code to 200 if not present
                if (!resp.response.code) {
                    resp.response.code = 200;
                }
                
                details += `
                    <div class="mt-3 p-3 rounded response-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">Response ${respIdx + 1}</h6>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-purple edit-response" data-predicate="${idx}" data-response="${respIdx}">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button class="btn btn-sm btn-danger delete-response" data-predicate="${idx}" data-response="${respIdx}">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label"><strong>Conditions:</strong></label>
                            <div class="response-field" data-field="when" data-predicate="${idx}" data-response="${respIdx}">
                                <pre class="response-text pre-transparent">${Object.keys(resp.when || {}).length > 0 ? JSON.stringify(resp.when, null, 2) : 'Not set'}</pre>
                                <textarea onfocus="autoResize(this)" class="form-control response-input" style="display: none;">${Object.keys(resp.when || {}).length > 0 ? JSON.stringify(resp.when, null, 2) : ''}</textarea>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label"><strong>Headers:</strong></label>
                            <div class="response-field" data-field="headers" data-predicate="${idx}" data-response="${respIdx}">
                                <pre class="response-text pre-transparent">${Object.keys(resp.response.headers || {}).length > 0 ? JSON.stringify(resp.response.headers, null, 2) : 'Not set'}</pre>
                                <textarea onfocus="autoResize(this)" class="form-control response-input" style="display: none;">${Object.keys(resp.response.headers || {}).length > 0 ? JSON.stringify(resp.response.headers, null, 2) : ''}</textarea>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label"><strong>Code:</strong></label>
                            <div class="response-field" data-field="code" data-predicate="${idx}" data-response="${respIdx}">
                                <div class="response-text">${resp.response.code}</div>
                                <select class="form-select response-input" style="width: 25%; display: none;">
                                    <option value="">Select Status Code</option>
                                    <optgroup label="1xx Informational">
                                        <option value="100" ${resp.response.code === 100 ? 'selected' : ''}>100 Continue</option>
                                        <option value="101" ${resp.response.code === 101 ? 'selected' : ''}>101 Switching Protocols</option>
                                        <option value="102" ${resp.response.code === 102 ? 'selected' : ''}>102 Processing</option>
                                        <option value="103" ${resp.response.code === 103 ? 'selected' : ''}>103 Early Hints</option>
                                    </optgroup>
                                    <optgroup label="2xx Success">
                                        <option value="200" ${resp.response.code === 200 ? 'selected' : ''}>200 OK</option>
                                        <option value="201" ${resp.response.code === 201 ? 'selected' : ''}>201 Created</option>
                                        <option value="202" ${resp.response.code === 202 ? 'selected' : ''}>202 Accepted</option>
                                        <option value="203" ${resp.response.code === 203 ? 'selected' : ''}>203 Non-Authoritative Information</option>
                                        <option value="204" ${resp.response.code === 204 ? 'selected' : ''}>204 No Content</option>
                                        <option value="205" ${resp.response.code === 205 ? 'selected' : ''}>205 Reset Content</option>
                                        <option value="206" ${resp.response.code === 206 ? 'selected' : ''}>206 Partial Content</option>
                                        <option value="207" ${resp.response.code === 207 ? 'selected' : ''}>207 Multi-Status</option>
                                        <option value="208" ${resp.response.code === 208 ? 'selected' : ''}>208 Already Reported</option>
                                        <option value="226" ${resp.response.code === 226 ? 'selected' : ''}>226 IM Used</option>
                                    </optgroup>
                                    <optgroup label="3xx Redirection">
                                        <option value="300" ${resp.response.code === 300 ? 'selected' : ''}>300 Multiple Choices</option>
                                        <option value="301" ${resp.response.code === 301 ? 'selected' : ''}>301 Moved Permanently</option>
                                        <option value="302" ${resp.response.code === 302 ? 'selected' : ''}>302 Found</option>
                                        <option value="303" ${resp.response.code === 303 ? 'selected' : ''}>303 See Other</option>
                                        <option value="304" ${resp.response.code === 304 ? 'selected' : ''}>304 Not Modified</option>
                                        <option value="305" ${resp.response.code === 305 ? 'selected' : ''}>305 Use Proxy</option>
                                        <option value="307" ${resp.response.code === 307 ? 'selected' : ''}>307 Temporary Redirect</option>
                                        <option value="308" ${resp.response.code === 308 ? 'selected' : ''}>308 Permanent Redirect</option>
                                    </optgroup>
                                    <optgroup label="4xx Client Errors">
                                        <option value="400" ${resp.response.code === 400 ? 'selected' : ''}>400 Bad Request</option>
                                        <option value="401" ${resp.response.code === 401 ? 'selected' : ''}>401 Unauthorized</option>
                                        <option value="402" ${resp.response.code === 402 ? 'selected' : ''}>402 Payment Required</option>
                                        <option value="403" ${resp.response.code === 403 ? 'selected' : ''}>403 Forbidden</option>
                                        <option value="404" ${resp.response.code === 404 ? 'selected' : ''}>404 Not Found</option>
                                        <option value="405" ${resp.response.code === 405 ? 'selected' : ''}>405 Method Not Allowed</option>
                                        <option value="406" ${resp.response.code === 406 ? 'selected' : ''}>406 Not Acceptable</option>
                                        <option value="407" ${resp.response.code === 407 ? 'selected' : ''}>407 Proxy Authentication Required</option>
                                        <option value="408" ${resp.response.code === 408 ? 'selected' : ''}>408 Request Timeout</option>
                                        <option value="409" ${resp.response.code === 409 ? 'selected' : ''}>409 Conflict</option>
                                        <option value="410" ${resp.response.code === 410 ? 'selected' : ''}>410 Gone</option>
                                        <option value="411" ${resp.response.code === 411 ? 'selected' : ''}>411 Length Required</option>
                                        <option value="412" ${resp.response.code === 412 ? 'selected' : ''}>412 Precondition Failed</option>
                                        <option value="413" ${resp.response.code === 413 ? 'selected' : ''}>413 Payload Too Large</option>
                                        <option value="414" ${resp.response.code === 414 ? 'selected' : ''}>414 URI Too Long</option>
                                        <option value="415" ${resp.response.code === 415 ? 'selected' : ''}>415 Unsupported Media Type</option>
                                        <option value="416" ${resp.response.code === 416 ? 'selected' : ''}>416 Range Not Satisfiable</option>
                                        <option value="417" ${resp.response.code === 417 ? 'selected' : ''}>417 Expectation Failed</option>
                                        <option value="418" ${resp.response.code === 418 ? 'selected' : ''}>418 I'm a teapot</option>
                                        <option value="421" ${resp.response.code === 421 ? 'selected' : ''}>421 Misdirected Request</option>
                                        <option value="422" ${resp.response.code === 422 ? 'selected' : ''}>422 Unprocessable Entity</option>
                                        <option value="423" ${resp.response.code === 423 ? 'selected' : ''}>423 Locked</option>
                                        <option value="424" ${resp.response.code === 424 ? 'selected' : ''}>424 Failed Dependency</option>
                                        <option value="425" ${resp.response.code === 425 ? 'selected' : ''}>425 Too Early</option>
                                        <option value="426" ${resp.response.code === 426 ? 'selected' : ''}>426 Upgrade Required</option>
                                        <option value="428" ${resp.response.code === 428 ? 'selected' : ''}>428 Precondition Required</option>
                                        <option value="429" ${resp.response.code === 429 ? 'selected' : ''}>429 Too Many Requests</option>
                                        <option value="431" ${resp.response.code === 431 ? 'selected' : ''}>431 Request Header Fields Too Large</option>
                                        <option value="451" ${resp.response.code === 451 ? 'selected' : ''}>451 Unavailable For Legal Reasons</option>
                                    </optgroup>
                                    <optgroup label="5xx Server Errors">
                                        <option value="500" ${resp.response.code === 500 ? 'selected' : ''}>500 Internal Server Error</option>
                                        <option value="501" ${resp.response.code === 501 ? 'selected' : ''}>501 Not Implemented</option>
                                        <option value="502" ${resp.response.code === 502 ? 'selected' : ''}>502 Bad Gateway</option>
                                        <option value="503" ${resp.response.code === 503 ? 'selected' : ''}>503 Service Unavailable</option>
                                        <option value="504" ${resp.response.code === 504 ? 'selected' : ''}>504 Gateway Timeout</option>
                                        <option value="505" ${resp.response.code === 505 ? 'selected' : ''}>505 HTTP Version Not Supported</option>
                                        <option value="506" ${resp.response.code === 506 ? 'selected' : ''}>506 Variant Also Negotiates</option>
                                        <option value="507" ${resp.response.code === 507 ? 'selected' : ''}>507 Insufficient Storage</option>
                                        <option value="508" ${resp.response.code === 508 ? 'selected' : ''}>508 Loop Detected</option>
                                        <option value="510" ${resp.response.code === 510 ? 'selected' : ''}>510 Not Extended</option>
                                        <option value="511" ${resp.response.code === 511 ? 'selected' : ''}>511 Network Authentication Required</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label"><strong>Content Type:</strong></label>
                            <div class="response-field" data-field="content_type" data-predicate="${idx}" data-response="${respIdx}">
                                <div class="response-text">${resp.response.content_type || 'text/plain'}</div>
                                <select class="form-select response-input" style="width: 25%; display: none;">
                                    <option value="text/plain" ${!resp.response.content_type || resp.response.content_type === 'text/plain' ? 'selected' : ''}>text/plain</option>
                                    <option value="application/json" ${resp.response.content_type === 'application/json' ? 'selected' : ''}>application/json</option>
                                    <option value="application/xml" ${resp.response.content_type === 'application/xml' ? 'selected' : ''}>application/xml</option>
                                    <option value="text/html" ${resp.response.content_type === 'text/html' ? 'selected' : ''}>text/html</option>
                                    <option value="text/css" ${resp.response.content_type === 'text/css' ? 'selected' : ''}>text/css</option>
                                    <option value="application/javascript" ${resp.response.content_type === 'application/javascript' ? 'selected' : ''}>application/javascript</option>
                                    <option value="application/octet-stream" ${resp.response.content_type === 'application/octet-stream' ? 'selected' : ''}>application/octet-stream</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-2">
                            <label class="form-label"><strong>Content:</strong></label>
                            <div class="response-field" data-field="content" data-predicate="${idx}" data-response="${respIdx}">
                                <pre class="response-text pre-transparent">${resp.response.content || 'Not set'}</pre>
                                <textarea onfocus="autoResize(this)" class="form-control response-input" style="display: none;" rows="3">${resp.response.content || ''}</textarea>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        // Add button to add new response
        details += `
            <div class="mt-3">
                <button class="btn btn-teal add-response" data-predicate="${idx}">
                    <i class="fa-solid fa-plus"></i> Add Response
                </button>
            </div>
        `;
        
        body.innerHTML = details;
        collapse.appendChild(body);
        
        accordionItem.appendChild(header);
        accordionItem.appendChild(collapse);
        accordion.appendChild(accordionItem);
    });

    list.appendChild(accordion);

    // Add the "Add Predicate" button at the bottom
    const addButtonContainer = document.createElement('div');
    addButtonContainer.className = 'mt-4';
    addButtonContainer.innerHTML = `
        <button class="btn btn-purple add-predicate" data-index="${index}">
            <i class="fa-solid fa-plus"></i> Add Predicate
        </button>
    `;
    list.appendChild(addButtonContainer);

    // Add event listeners for edit and delete buttons
    setupImposterListeners(imposter, index);
    setupPredicateEventListeners(imposter, index);

    // Add event listener for the Add Predicate button
    document.querySelector('.add-predicate').addEventListener('click', () => {
        showAddPredicateModal(index);
    });
}

function setupImposterListeners(imposter, imposterIndex) {
    // Delete imposter
    document.querySelectorAll('.delete-imposter').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            showCommonModal({
                title: 'Confirm Delete',
                message: 'Are you sure you want to delete this imposter?',
                type: 'danger',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    const idx = parseInt(e.target.closest('.delete-imposter').dataset.index);
                    imposter.predicates.splice(idx, 1);
                    await deleteImposter(imposterIndex);
                    showPredicates(imposterIndex);
                }
            });
        });
    });
}

function setupPredicateEventListeners(imposter, imposterIndex) {
    // Edit predicate fields
    document.querySelectorAll('.edit-predicate').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.target.closest('.edit-predicate').dataset.index);
            const fields = document.querySelectorAll(`.predicate-field[data-index="${idx}"]`);
            const isEditing = e.target.closest('.edit-predicate').classList.contains('active');
            
            fields.forEach(field => {
                const text = field.querySelector('.predicate-text');
                const input = field.querySelector('.predicate-input');
                
                if (!isEditing) {
                    text.style.display = 'none';
                    input.style.display = 'block';
                    const numberInput = input.querySelector('input');
                    if (numberInput) {
                        numberInput.focus();
                    }
                    e.target.closest('.edit-predicate').classList.add('active');
                } else {
                    text.style.display = 'block';
                    input.style.display = 'none';
                    
                    // Update the value
                    const fieldName = field.dataset.field;
                    let value = null;
                    if (fieldName === 'delay') {
                        const numberInput = input.querySelector('input');
                        const unitSelect = input.querySelector('select');
                        const number = parseInt(numberInput.value);
                        if (!isNaN(number) && number > 0) {
                            value = `${number}${unitSelect.value}`;
                        }
                    } else if(fieldName === 'force_response') {
                        value = parseInt(input.value.trim());
                    } else {
                        value = input.value.trim();
                    }

                    imposter.predicates[idx][fieldName] = value || null;
                    
                    // Update display text
                    text.textContent = value || 'Not set';
                    e.target.closest('.edit-predicate').classList.remove('active');
                }
            });
            // Save changes
            if(isEditing) {
                updateImposter(imposterIndex, imposter);
            }
        });
    });

    // Edit response fields
    document.querySelectorAll('.edit-response').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const predicateIdx = parseInt(e.target.closest('.edit-response').dataset.predicate);
            const responseIdx = parseInt(e.target.closest('.edit-response').dataset.response);
            const fields = document.querySelectorAll(`.response-field[data-predicate="${predicateIdx}"][data-response="${responseIdx}"]`);
            const isEditing = e.target.closest('.edit-response').classList.contains('active');
            
            fields.forEach(field => {
                const text = field.querySelector('.response-text');
                const input = field.querySelector('.response-input');
                
                if (!isEditing) {
                    text.style.display = 'none';
                    input.style.display = 'block';
                    if (input.tagName === 'TEXTAREA') {
                        input.focus();
                    }
                    e.target.closest('.edit-response').classList.add('active');
                } else {
                    text.style.display = 'block';
                    input.style.display = 'none';
                    
                    // Update the value
                    const fieldName = field.dataset.field;
                    let value = null;
                    
                    if (fieldName === 'headers' || fieldName === 'when') {
                        try {
                            value = JSON.parse(input.value) || {};
                        } catch (e) {
                            value = {};
                        }
                    } else if (fieldName === 'code') {
                        value = parseInt(input.value);
                    } else {
                        value = input.value;
                    }
                    
                    // Update the model
                    if (fieldName === 'headers') {
                        imposter.predicates[predicateIdx].responses[responseIdx].response.headers = value;
                    } else if (fieldName === 'content_type') {
                        imposter.predicates[predicateIdx].responses[responseIdx].response.content_type = value;
                    } else if (fieldName === 'code') {
                        imposter.predicates[predicateIdx].responses[responseIdx].response.code = value;
                    } else if (fieldName === 'when') {
                        imposter.predicates[predicateIdx].responses[responseIdx].when = value;
                    } else {
                        // Store content with type-specific sanitization
                        const contentType = imposter.predicates[predicateIdx].responses[responseIdx].response.content_type || 'text/plain';
                        imposter.predicates[predicateIdx].responses[responseIdx].response[fieldName] = value;
                    }
                    
                    // Update the display
                    if (fieldName === 'headers' || fieldName === 'when') {
                        text.textContent = Object.keys(value).length > 0 ? JSON.stringify(value, null, 2) : 'Not set';
                    } else {
                        text.textContent = value || 'Not set';
                    }
                    
                    e.target.closest('.edit-response').classList.remove('active');
                }
            });

            // Save changes
            if(isEditing) {
                updateImposter(imposterIndex, imposter);
            }
        });
    });

    // Delete predicate
    document.querySelectorAll('.delete-predicate').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            showCommonModal({
                title: 'Confirm Delete',
                message: 'Are you sure you want to delete this predicate?',
                type: 'danger',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    const idx = parseInt(e.target.closest('.delete-predicate').dataset.index);
                    imposter.predicates.splice(idx, 1);
                    await updateImposter(imposterIndex, imposter);
                    showPredicates(imposterIndex);
                }
            });
        });
    });

    // Delete response
    document.querySelectorAll('.delete-response').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            showCommonModal({
                title: 'Confirm Delete',
                message: 'Are you sure you want to delete this response?',
                type: 'danger',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                onConfirm: async () => {
                    const predicateIdx = parseInt(e.target.closest('.delete-response').dataset.predicate);
                    const responseIdx = parseInt(e.target.closest('.delete-response').dataset.response);
                    imposter.predicates[predicateIdx].responses.splice(responseIdx, 1);
                    await updateImposter(imposterIndex, imposter);
                    showPredicates(imposterIndex);
                }
            });
        });
    });

    // Add new response
    document.querySelectorAll('.add-response').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const predicateIdx = parseInt(e.target.closest('.add-response').dataset.predicate);
            
            // Create new response object
            const newResponse = {
                response: {
                    code: 200,
                    content: 'Default New Response',
                    content_type: 'text/plain',
                    headers: {}
                }
            };
            
            // Add to model
            if (!imposter.predicates[predicateIdx].responses) {
                imposter.predicates[predicateIdx].responses = [];
            }
            imposter.predicates[predicateIdx].responses.push(newResponse);
            
            // Save changes
            updateImposter(imposterIndex, imposter);
            
            // Refresh view
            showPredicates(imposterIndex);
        });
    });
}

async function updateImposter(index, imposterData) {
    try {
        await fetchData(`/_imposters/${index}`, {
            method: 'PUT',
            body: JSON.stringify(imposterData)
        });
        await fetchImposters();
        return true;
    } catch (error) {
        showCommonModal({
            title: 'Update Failed',
            message: 'Failed to update imposter. Please try again.',
            type: 'danger',
            confirmText: 'OK'
        });
        return false;
    }
}


async function deleteImposter(index) {
    try {
        await fetchData(`/_imposters/${index}`, {
            method: 'DELETE'
        });
        await fetchImposters();
        return true;
    } catch (error) {
        showCommonModal({
            title: 'Delete Failed',
            message: 'Failed to delete imposter. Please try again.',
            type: 'danger',
            confirmText: 'OK'
        });
        return false;
    }
}

// Data Management
async function fetchImposters() {
    const list = document.getElementById('imposter-list');

    try {
        impostersData = await fetchData('/_imposters');
        
        list.innerHTML = '';
        impostersData.forEach((i, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-action imposter-item';
            li.innerHTML = `<i class="fa-solid fa-cube"></i><span style="margin-left: .5rem;">${i.imposter.name}</span>`;
            li.onclick = () => showPredicates(index);
            list.appendChild(li);
        });
    } catch (error) {
        list.innerHTML = '<li class="list-group-item text-danger">Failed to load imposters</li>';
    }
}

async function createImposter(formData) {
    try {
        await fetchData('/_imposters', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        await fetchImposters();
        showCommonModal({
            title: 'Success',
            message: 'Imposter created successfully!',
            type: 'success',
            confirmText: 'OK'
        });
        return true;
    } catch (error) {
        showCommonModal({
            title: 'Creation Failed',
            message: 'Failed to create imposter. Please try again.',
            type: 'danger',
            confirmText: 'OK'
        });
        return false;
    }
}

async function runTests() {
    switchMainContent("test");
    const testSection = document.getElementById('main-content-test');
    testSection.innerHTML = '<h1 class="mt-3 px-2">Test Cases</h1>';

    try {
        const result = await fetchData('/_tests', {}, "Running Tests...");
        tests = result["tests"];
        cases = result["cases"];

        // Create accordion container
        const accordion = document.createElement('div');
        accordion.className = 'accordion mt-3 px-2';
        accordion.id = 'testAccordion';

        // Create accordion items for each test
        tests.forEach((test, index) => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            
            // Create header with test name and status
            const header = document.createElement('h2');
            header.className = 'accordion-header';
            header.id = `headingTest${index}`;
            
            const button = document.createElement('button');
            button.className = 'accordion-button collapsed';
            button.type = 'button';
            button.setAttribute('data-bs-toggle', 'collapse');
            button.setAttribute('data-bs-target', `#collapseTest${index}`);
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-controls', `collapseTest${index}`);
            
            // Add test name and status to header
            const headerContent = document.createElement('div');
            headerContent.className = 'd-flex justify-content-between align-items-center w-100';
            headerContent.innerHTML = `
                <span>${test.name}</span>
                <span class="${test.status === 'Pass' ? 'text-success fw-bold' : 'text-danger fw-bold'}">${test.status}</span>
            `;
            button.appendChild(headerContent);
            header.appendChild(button);
            
            // Create accordion body with test details
            const collapse = document.createElement('div');
            collapse.id = `collapseTest${index}`;
            collapse.className = 'accordion-collapse collapse';
            collapse.setAttribute('aria-labelledby', `headingTest${index}`);
            collapse.setAttribute('data-bs-parent', '#testAccordion');
            
            const body = document.createElement('div');
            body.className = 'accordion-body';
            
            // Find corresponding test case
            const testCase = cases.find(c => c.name === test.name);
            if (testCase) {
                body.innerHTML = `
                    <div class="mb-4">
                        <h5>Imposter</h5>
                        <pre class="p-3 rounded">
Type: ${testCase.imposter.type}
Name: ${testCase.imposter.name}</pre>
                    </div>
                    <div class="mb-4">
                        <h5>Request</h5>
                        <pre class="p-3 rounded">
Method: ${testCase.request.type}
URL: ${testCase.request.url}
Headers: ${JSON.stringify(testCase.request.headers, null, 2)}
Body: ${JSON.stringify(testCase.request.body, null, 2)}</pre>
                    </div>
                    <div class="mb-4">
                        <h5>Response</h5>
                        <pre class="p-3 rounded">
Delay: ${testCase.response.delay || 'None'}
Headers: ${JSON.stringify(testCase.response.headers, null, 2)}
Code: ${testCase.response.code}
Content-Type: ${testCase.response['content-type']}
Content: <pre class="p-3 rounded">${sanitizeContent(testCase.response.content, testCase.response['content-type'])}</pre></pre>
                    </div>
                `;
            }
            
            collapse.appendChild(body);
            accordionItem.appendChild(header);
            accordionItem.appendChild(collapse);
            accordion.appendChild(accordionItem);
        });

        testSection.appendChild(accordion);

    } catch (error) {
        showCommonModal({
            title: 'Test Error',
            message: 'Failed to run tests. Please try again.',
            type: 'danger',
            confirmText: 'OK'
        });
        testSection.innerHTML += '<div class="text-danger mt-3 px-2">Failed to run tests</div>';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Dark mode handling
    const modeToggle = document.getElementById('modeToggle');
    
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === null) {
        document.body.classList.add('dark-mode');
        modeToggle.checked = true;
        localStorage.setItem('darkMode', 'true');
    } else if (savedMode === 'true') {
        document.body.classList.add('dark-mode');
        modeToggle.checked = true;
    }

    modeToggle.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode', this.checked);
        localStorage.setItem('darkMode', this.checked);
    });

    // Form submission
    document.getElementById('imposter-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            imposter: {
                name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                type: document.getElementById('type').value
            },
            predicates: []
        };

        const success = await createImposter(formData);
        if (success) {
            this.reset();
        }
    });
});

// Initial load
fetchImposters();
showPredicates();

function showAddPredicateModal(imposterIndex) {
    const modalContent = `
        <form id="addPredicateForm">
            <div class="mb-3">
                <label class="form-label">Method</label>
                <select class="form-select" name="method" required>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Path</label>
                <input type="text" class="form-control" name="path" required placeholder="/example/path">
            </div>
            <div class="mb-3">
                <label class="form-label">Delay (optional)</label>
                <div class="input-group">
                    <input type="number" class="form-control" name="delayValue" min="0" value="0">
                    <select class="form-select" name="delayUnit" style="width: auto;">
                        <option value="ms">ms</option>
                        <option value="s">s</option>
                        <option value="m">m</option>
                        <option value="h">h</option>
                    </select>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Force Response (optional)</label>
                <select class="form-select" name="force_response">
                    <option value="">Select Status Code</option>
                    <optgroup label="2xx Success">
                        <option value="200">200 OK</option>
                        <option value="201">201 Created</option>
                        <option value="202">202 Accepted</option>
                        <option value="204">204 No Content</option>
                    </optgroup>
                    <optgroup label="4xx Client Errors">
                        <option value="400">400 Bad Request</option>
                        <option value="401">401 Unauthorized</option>
                        <option value="403">403 Forbidden</option>
                        <option value="404">404 Not Found</option>
                    </optgroup>
                    <optgroup label="5xx Server Errors">
                        <option value="500">500 Internal Server Error</option>
                        <option value="502">502 Bad Gateway</option>
                        <option value="503">503 Service Unavailable</option>
                    </optgroup>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Default Response (optional)</label>
                <div class="card">
                    <div class="card-body">
                        <div class="mb-2">
                            <label class="form-label">Status Code</label>
                            <select class="form-select" name="responseCode">
                                <option value="200">200 OK</option>
                                <option value="201">201 Created</option>
                                <option value="400">400 Bad Request</option>
                                <option value="404">404 Not Found</option>
                                <option value="500">500 Internal Server Error</option>
                            </select>
                        </div>
                        <div class="mb-2">
                            <label class="form-label">Content</label>
                            <textarea class="form-control" name="responseContent" onfocus="autoResize(this)" rows="3"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;

    showCommonModal({
        title: 'Add New Predicate',
        message: modalContent,
        type: 'purple',
        confirmText: 'Add',
        cancelText: 'Cancel',
        onConfirm: async () => {
            const form = document.getElementById('addPredicateForm');
            const formData = new FormData(form);
            
            // Create new predicate
            const newPredicate = {
                method: formData.get('method'),
                path: formData.get('path'),
                force_response: formData.get('force_response') ? parseInt(formData.get('force_response')) : undefined
            };

            // Add delay if specified
            const delayValue = parseInt(formData.get('delayValue'));
            if (delayValue > 0) {
                newPredicate.delay = `${delayValue}${formData.get('delayUnit')}`;
            }

            // Add default response if specified
            const responseContent = formData.get('responseContent');
            if (responseContent) {
                newPredicate.response = {
                    code: parseInt(formData.get('responseCode')),
                    content: responseContent
                };
            }

            // Get current imposter data
            const imposter = impostersData[imposterIndex];
            
            // Add new predicate to imposter's predicates
            imposter.predicates.push(newPredicate);

            try {
                const response = await fetch(`/_imposters/${imposterIndex}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(imposter)
                });

                if (!response.ok) {
                    throw new Error('Failed to add predicate');
                }

                // Refresh the predicates view
                showPredicates(imposterIndex);
            } catch (error) {
                showCommonModal({
                    title: 'Error',
                    message: error.message,
                    type: 'danger',
                    confirmText: 'OK'
                });
            }
        }
    });
}

function showCreateImposterModal(prefilledData = null) {
    const modal = new bootstrap.Modal(document.getElementById('createImposterModal'));
    
    // Reset form
    document.getElementById('createImposterForm').reset();
    document.getElementById('predicatesAccordion').innerHTML = '';
    document.getElementById('responsesAccordion').innerHTML = '';
    
    // Add initial predicate and response sections
    addPredicateSection();
    addResponseSection();
    
    // If prefilled data is provided, populate the form
    if (prefilledData) {
        document.getElementById('imposterName').value = prefilledData.name;
        document.getElementById('imposterDescription').value = prefilledData.description;
        
        // Clear initial sections
        document.getElementById('predicatesAccordion').innerHTML = '';
        document.getElementById('responsesAccordion').innerHTML = '';
        
        // Add predicate
        if (prefilledData.predicates && prefilledData.predicates.length > 0) {
            const predicate = prefilledData.predicates[0];
            const predicateSection = addPredicateSection();
            const methodSelect = predicateSection.querySelector('[name="method"]');
            const pathInput = predicateSection.querySelector('[name="path"]');
            const queryInput = predicateSection.querySelector('[name="query"]');
            const headersInput = predicateSection.querySelector('[name="headers"]');
            const bodyInput = predicateSection.querySelector('[name="body"]');
            
            methodSelect.value = predicate.method;
            pathInput.value = predicate.path;
            if (predicate.query) queryInput.value = JSON.stringify(predicate.query, null, 2);
            if (predicate.headers) headersInput.value = JSON.stringify(predicate.headers, null, 2);
            if (predicate.body) bodyInput.value = JSON.stringify(predicate.body, null, 2);
        }
        
        // Add response
        if (prefilledData.responses && prefilledData.responses.length > 0) {
            const response = prefilledData.responses[0];
            const responseSection = addResponseSection();
            const statusInput = responseSection.querySelector('[name="statusCode"]');
            const headersInput = responseSection.querySelector('[name="headers"]');
            const bodyInput = responseSection.querySelector('[name="body"]');
            
            statusInput.value = response.statusCode;
            if (response.headers) headersInput.value = JSON.stringify(response.headers, null, 2);
            if (response.body) bodyInput.value = JSON.stringify(response.body, null, 2);
        }
    }
    
    modal.show();
}