import {
    StateDomainSchema,
    StateDomain
} from "https://global.hexstream.dev/scripts/state-domain.mjs";

import {
    bind,
    DocumentSelector
} from "https://global.hexstream.dev/scripts/event-binding.mjs";

export {
    preferences
}


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
    };
}

const preferencesSchema = new StateDomainSchema(
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

        "/accounts/keybase.visibility":
        show_hide_if_accounts,

        "highlights.visibility":
        show_hide,

        "funding.visibility":
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

const preferences = new StateDomain(preferencesSchema);

const localStorage = globalThis.localStorage;

bind("=",
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
bind("=",
     [
         {
             type: "storage",
             storage: preferences
         },
         {
             type: "selector",
             selector: new DocumentSelector(document.documentElement, "site-prefs")
         }
     ]);
bind(">",
     [
         {
             type: "storage",
             storage: preferences,
             keys: preferences.schema.keys
         },
         {
             type: "tokenlist",
             tokenlist: document.documentElement.classList
         }
     ]);
