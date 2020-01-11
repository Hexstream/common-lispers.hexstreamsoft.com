"use strict";

class Search {

    static normalize (string) {
        return string.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize();
    }

    static init () {
        if (Search.initialized)
            return;
        console.time("Search.init()");
        const persons = [];
        document.querySelectorAll("#common-lispers > *").forEach(function (person) {
            const fields = [];
            function add (is, selector, visibilityPreferencesKey, noValue) {
                person.querySelectorAll(selector).forEach(function (node) {
                    fields.push({
                        node: node,
                        visibilityPreferencesKey: visibilityPreferencesKey,
                        value: noValue ? "∅" : Search.normalize(node.textContent),
                        is: is
                    });
                });
            }
            add("fullname", ".full-name", "fullname.visibility");
            add("middlename", ".middle-name", "middlename.visibility");
            add("nickname", ".nickname", "nickname.visibility");
            add("linkablenick", ".nickname a[href]", "nickname.visibility");
            add("website", ".website", "website.visibility", true);
            add("blog", ".blog", "blog.visibility", true);
            person.querySelectorAll(".social").forEach(function (socialNode) {
                const socialKind = socialNode.dataset.socialKind;
                const visibilityPreferencesKey = socialKindToVisibilityPreferencesKey[socialKind];
                const node = socialNode.querySelector(".v a");
                fields.push({
                    node: node,
                    visibilityPreferencesKey: visibilityPreferencesKey,
                    value: Search.normalize(node.textContent),
                    is: socialKind
                });
            });
            add("highlight", ".highlights .v > a", "highlights.visibility");
            add("highlight", ".highlights .v > span", "highlights.visibility");
            add("portal", ".portal", "portal.visibility", true);
            const id = person.id;
            const record = {
                id: id,
                fields: fields,
                node: person
            };
            // TODO: Generalize and also handle Michał Psota.
            if (id === "Michał_Herda")
                record.fields.find(field => field.is === "fullname").value = Search.normalize("Michal Herda");
            persons.push(record);
        });
        Search.persons = persons;
        Search.initialized = true;
        console.timeEnd("Search.init()");
    }

    static computeSearchResults (searchString) {
        if (searchString === "" || searchString === "has:")
            return new Search.Results.NullResults();
        else if (searchString.startsWith("has:") || searchString.startsWith("!has:"))
            return new Search.Results.HasResults(searchString);
        else
            return new Search.Results.NormalResults(searchString);
    }

    static applySearch (searchString) {
        searchString = Search.normalize(searchString);
        Search.init();
        const previousSearchResults = Search.currentSearchResults;
        const searchTimerName = `search("${searchString}")`;
        searchString = searchString.replace("ł", "l");
        console.time(searchTimerName);
        const cached = Search.cache[searchString];
        const currentSearchResults = cached || Search.computeSearchResults(searchString);
        if (cached)
            console.log("(from cache)");
        else
            Search.cache[searchString] = currentSearchResults;
        console.timeEnd(searchTimerName);
        const populateTimerName = `populate("${searchString}")`;
        console.time(populateTimerName);
        const resultsParent = document.querySelector("#common-lispers");
        resultsParent.textContent = "";
        if (previousSearchResults)
            previousSearchResults.unapplyResults();
        currentSearchResults.applyResults();
        Search.currentSearchResults = currentSearchResults;
        const resultsFragment = document.createDocumentFragment();
        currentSearchResults.results.forEach(function (result) {
            resultsFragment.appendChild(result.node);
        });
        resultsParent.appendChild(resultsFragment);
        const resultsCount = currentSearchResults.results.length;
        var howMany = resultsCount === 0 ? "Nobody" : resultsCount + (resultsCount === 1 ? " person" : " people");
        if (resultsCount > 0 && resultsCount < Search.persons.length)
            howMany += " (" + (resultsCount / Search.persons.length * 100).toFixed(0) + "%)"
        Search.summaryNode.textContent = howMany;
        console.timeEnd(populateTimerName);
    }

    static register () {
        Search.summaryNode = document.querySelector("#search-wrapper .summary");
        Search.summaryNode.textContent = document.querySelectorAll(".card").length + " people";
        const field = document.querySelector("#search");
        field.disabled = false;
        field.placeholder = "Search...";
        Search.searchField = field;
        if (field === document.activeElement)
            Search.init();
        else
            field.addEventListener("focus", function () {
                Search.init();
            }, {once: true});
        field.addEventListener("input", function (event) {
            Search.applySearch(event.target.value);
        });
    }

}

Search.Results = class Results {
    applyResults () {
    }

    unapplyResults () {
    }
}

Search.Results.NullResults = class NullResults extends Search.Results {
    constructor () {
        super("");
        this.results = Search.persons.map(person => ({
            node: person.node
        }));
    }
}

Search.Results.HasResults = class HasResults extends Search.Results {
    constructor (searchString) {
        super(searchString);
        const inverse = searchString[0] === "!";
        if (inverse)
            searchString = searchString.slice(1);
        searchString = searchString.slice(4);
        const results = [];
        function matches (kind) {
            return kind.startsWith(searchString);
        }
        Search.persons.forEach(function (person) {
            const matchingFields = [];
            person.fields.forEach(function (field) {
                const prefsProps = preferences.properties[field.visibilityPreferencesKey];
                const isVisible = prefsProps.relevant && prefsProps.value === "show";
                if (isVisible && matches(field.is))
                    matchingFields.push(field);
            });
            const matchCount = matchingFields.length;
            if ((!inverse && matchCount > 0) || (inverse && matchCount === 0))
                results.push({
                    node: person.node,
                    matchingFields: matchingFields
                });
        });
        this.results = results;
    }

    applyResults () {
        this.results.forEach(function (result) {
            result.matchingFields.forEach(function (field) {
                field.node.classList.add("matches");
            });
        });
    }

    unapplyResults () {
        this.results.forEach(function (result) {
            result.matchingFields.forEach(function (field) {
                field.node.classList.remove("matches");
            });
        });
    }
}

Search.Results.NormalResults = class NormalResults extends Search.Results {
    constructor (searchString) {
        super(searchString);
        const results = [];
        function matches (value) {
            const matchIndex = value.indexOf(searchString);
            return matchIndex >= 0 && (matchIndex === 0 || " ([".indexOf(value.charAt(matchIndex - 1)) >= 0);
        };
        Search.persons.forEach(function (person) {
            const matchingFields = [];
            person.fields.forEach(function (field) {
                const prefsProps = preferences.properties[field.visibilityPreferencesKey];
                const isVisible = prefsProps.relevant && prefsProps.value === "show";
                if (isVisible && matches(field.value))
                    matchingFields.push(field);
            });
            if (matchingFields.length > 0)
                results.push({
                    node: person.node,
                    matchingFields: matchingFields
                });
        });
        this.results = results;
    }

    applyResults () {
        this.results.forEach(function (result) {
            result.matchingFields.forEach(function (field) {
                field.node.classList.add("matches");
            });
        });
    }

    unapplyResults () {
        this.results.forEach(function (result) {
            result.matchingFields.forEach(function (field) {
                field.node.classList.remove("matches");
            });
        });
    }
}

Search.initialized = false;
Search.cache = {};
