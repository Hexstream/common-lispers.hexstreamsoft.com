"use strict";

HexstreamSoft.modules.ensure("HexstreamSoft.StateDomain", "HexstreamSoft.EventBinding");

const preferencesSchema = (function () {
    const show_hide = {
        possibleValues: ["show", "hide"],
        defaultValue: "show"
    };
    const show_hide_if_accounts = {
        possibleValues: ["show", "hide"],
        defaultValue: "show",
        computeRelevance: function (preferences) {
            return preferences["accounts.visibility"] === "show";
        }
    };
    const show_hide_if_accounts_default_hide = {
        possibleValues: ["show", "hide"],
        defaultValue: "hide",
        computeRelevance: function (preferences) {
            return preferences["accounts.visibility"] === "show";
        }
    };
    function show_hide_if_category (category) {
        return {
            possibleValues: ["show", "hide"],
            defaultValue: "show",
            computeRelevance: function (preferences) {
                return preferences["accounts.visibility"] === "show"
                    && preferences[category] === "show";
            }
        }
    }
    return new HexstreamSoft.StateDomainSchema(
    {
        "sort-order":
        {
            possibleValues: ["random", "alphabetical"],
            defaultValue: "random"
        },

        "fullname.visibility":
        show_hide,

        "middlename.visibility":
        show_hide,

        "nickname.visibility":
        show_hide,

        "website.visibility":
        show_hide,

        "blog.visibility":
        show_hide,

        "accounts.visibility":
        show_hide,

        "/accounts/coding.visibility":
        show_hide_if_accounts,

        "/accounts/coding/github.visibility":
        show_hide_if_category("/accounts/coding.visibility"),

        "/accounts/coding/gitlab.visibility":
        show_hide_if_category("/accounts/coding.visibility"),

        "/accounts/coding/bitbucket.visibility":
        show_hide_if_category("/accounts/coding.visibility"),

        "/accounts/microblogging.visibility":
        show_hide_if_accounts,

        "/accounts/microblogging/twitter.visibility":
        show_hide_if_category("/accounts/microblogging.visibility"),

        "/accounts/microblogging/mastodon.visibility":
        show_hide_if_category("/accounts/microblogging.visibility"),

        "/accounts/funding.visibility":
        show_hide_if_accounts,

        "/accounts/funding/patreon.visibility":
        show_hide_if_category("/accounts/funding.visibility"),

        "/accounts/keybase.visibility":
        show_hide_if_accounts,

        "highlights.visibility":
        show_hide,

        "portal.visibility":
        show_hide,

        "/accounts/cv.visibility":
        show_hide_if_accounts,

        "/accounts/cv/linkedin.visibility":
        show_hide_if_category("/accounts/cv.visibility"),

        "blocklist.status":
        {
            possibleValues: ["enabled", "disabled"],
            defaultValue: "enabled"
        },

        "/blocklist/blocked.visibility":
        {
            possibleValues: ["show", "hide"],
            defaultValue: "hide",
            computeRelevance: function (preferences) {
                return preferences["blocklist.status"] === "enabled";
            }
        }
    });
})();

const preferences = new HexstreamSoft.StateDomain(preferencesSchema);

HexstreamSoft.EventBinding.bind(
    "=",
    [
        {
            type: "storage",
            storage: localStorage
        },
        {
            type: "storage",
            storage: preferences
        }
    ],
    {
        source:
        {
            keys: preferences.schema.keys
        }
    }
);
HexstreamSoft.EventBinding.bind(
    "=",
    [
        {
            type: "storage",
            storage: preferences
        },
        {
            type: "document",
            document: document.documentElement,
            stateDomainName: "site-prefs"
        }
    ]);
HexstreamSoft.EventBinding.bind(
    ">",
    [
        {
            type: "storage",
            storage: preferences,
            keys: preferences.schema.keys
        },
        {
            type: "classList",
            node: document.documentElement
        }
    ]);


const socialKindToVisibilityPreferencesKey = {
    github: "/accounts/coding/github.visibility",
    gitlab: "/accounts/coding/gitlab.visibility",
    bitbucket: "/accounts/coding/bitbucket.visibility",
    twitter: "/accounts/microblogging/twitter.visibility",
    mastodon: "/accounts/microblogging/mastodon.visibility",
    patreon: "/accounts/funding/patreon.visibility",
    keybase: "/accounts/keybase.visibility",
    linkedin: "/accounts/cv/linkedin.visibility"
};



function escapePersonID (personID) {
    return personID.replace(/'/g, "\\'");
}

class Blocklist {

    static block (id) {
        if (Blocklist.blocklist.indexOf(id) <= 0)
        {
            Blocklist.blocklist.push(id);
            localStorage.blocklist = JSON.stringify(Blocklist.blocklist);
            document.querySelector("#" + escapePersonID(id)).classList.add("blocked");
            window.location.hash = "blocked";
        }
    }

    static unblock (id) {
        const index = Blocklist.blocklist.indexOf(id);
        if (index >= 0)
        {
            Blocklist.blocklist.splice(index, 1);
            localStorage.blocklist = JSON.stringify(Blocklist.blocklist);
            document.querySelector("#" + escapePersonID(id)).classList.remove("blocked");
        }
    }

}

Blocklist.blocklist = (localStorage && JSON.parse(localStorage.blocklist || "[]"));
