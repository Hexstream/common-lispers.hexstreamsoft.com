import {
    preferences
} from "./scripts/prefs.mjs";

const persons = [];
const cache = {};

const socialKindToVisibilityPreferencesKey = {
    github: "/accounts/coding/github.visibility",
    gitlab: "/accounts/coding/gitlab.visibility",
    bitbucket: "/accounts/coding/bitbucket.visibility",
    twitter: "/accounts/microblogging/twitter.visibility",
    mastodon: "/accounts/microblogging/mastodon.visibility",
    keybase: "/accounts/keybase.visibility",
    linkedin: "/accounts/cv/linkedin.visibility"
};

function normalize (string) {
    return string.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize();
}

for (const person of document.querySelectorAll("#common-lispers > *")) {
    const fields = [];
    function add (is, selector, visibilityPreferencesKey, noValue) {
        person.querySelectorAll(selector).forEach(function (node) {
            fields.push({
                node: node,
                visibilityPreferencesKey: visibilityPreferencesKey,
                value: noValue ? "∅" : normalize(node.textContent),
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
            value: normalize(node.textContent),
            is: socialKind
        });
    });
    add("highlights", ".highlights .v > a", "highlights.visibility");
    add("highlights", ".highlights .v > span", "highlights.visibility");
    add("funding", ".funding .v > a", "funding.visibility");
    add("portal", ".portal", "portal.visibility", true);
    const id = person.id;
    const record = {
        id: id,
        fields: fields,
        node: person
    };
    // TODO: Generalize and also handle Michał Psota.
    if (id === "Michał_Herda")
        record.fields.find(field => field.is === "fullname").value = normalize("Michal Herda");
    persons.push(record);
}

function computeSearchResults (searchString) {
    if (searchString === "" || searchString === "has:")
        return new NullResults();
    else if (searchString.startsWith("has:") || searchString.startsWith("!has:"))
        return new HasResults(searchString);
    else
        return new NormalResults(searchString);
}

let currentResults;
const summaryNode = document.querySelector("#search-wrapper .summary");

function applySearch (searchString) {
    searchString = normalize(searchString);
    const previousResults = currentResults;
    const searchTimerName = `search("${searchString}")`;
    searchString = searchString.replace("ł", "l");
    console.time(searchTimerName);
    const cached = cache[searchString];
    currentResults = cached ?? computeSearchResults(searchString);
    if (cached)
        console.log("(from cache)");
    else
        cache[searchString] = currentResults;
    console.timeEnd(searchTimerName);
    const populateTimerName = `populate("${searchString}")`;
    console.time(populateTimerName);
    const resultsParent = document.querySelector("#common-lispers");
    resultsParent.textContent = "";
    previousResults?.unapplyResults();
    currentResults.applyResults();
    const resultsFragment = document.createDocumentFragment();
    currentResults.results.forEach(function (result) {
        resultsFragment.appendChild(result.node);
    });
    resultsParent.appendChild(resultsFragment);
    const resultsCount = currentResults.results.length;
    var howMany = resultsCount === 0 ? "Nobody" : resultsCount + (resultsCount === 1 ? " person" : " people");
    if (resultsCount > 0 && resultsCount < persons.length)
        howMany += " (" + (resultsCount / persons.length * 100).toFixed(0) + "%)";
    summaryNode.textContent = howMany;
    console.timeEnd(populateTimerName);
}

document.querySelector("#search").addEventListener("input", function (event) {
    applySearch(event.target.value);
});

class Results {
    applyResults () {
    }

    unapplyResults () {
    }
}

class NullResults extends Results {
    constructor () {
        super("");
        this.results = persons.map(person => ({
            node: person.node
        }));
    }
}

class HasResults extends Results {
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
        for (const person of persons) {
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
        }
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

class NormalResults extends Results {
    constructor (searchString) {
        super(searchString);
        const results = [];
        function matches (value) {
            const matchIndex = value.indexOf(searchString);
            return matchIndex >= 0 && (matchIndex === 0 || " ([".indexOf(value.charAt(matchIndex - 1)) >= 0);
        };
        persons.forEach(function (person) {
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
