import Ember from 'ember';
import layout from './template';

import permissions from 'ember-osf/const/permissions';

export default Ember.Component.extend({
    READ: permissions.READ,
    WRITE: permissions.WRITE,
    ADMIN: permissions.ADMIN,
    layout: layout,
    permissionChanges: {},
    bibliographicChanges: {},
    permissionToggle: false,
    bibliographicToggle: false,
    removalToggle: false,
    stillAdmin: Ember.computed('isAdmin', function() {
        return this.get('isAdmin');
    }),
    searched: false,
    query: null,
    newlyAdded: Ember.A([]),
    actions: {
        addContributor(user, permission, isBibliographic) {
            this.sendAction('addContributor', user.id, permission, isBibliographic);
            this.get('searchResults').removeObject(user);
            this.get('newlyAdded').addObject(user);
        },
        updateQuery(value) {
            this.set('query', value);
            this.set('searched', false);
            this.set('newlyAdded', Ember.A([]));
        },
        findContributors() {
            this.set('searched', true);
            var query = this.get('query');
            this.sendAction('findContributors', query);
        },
        removeContributor(contrib) {
            this.sendAction('removeContributor', contrib);
            this.toggleProperty('removalToggle');
            this.removedSelfAsAdmin(contrib, contrib.get('permission'));
            var recentlyAddedIndex = this.get('newlyAdded').map(function(contrib) {return contrib.id;}).indexOf(contrib.id.split('-')[1]);
            this.get('contributors').removeObject(contrib);
            if (this.get('query') && recentlyAddedIndex > -1) {
                var restoredUser = this.get('newlyAdded')[recentlyAddedIndex];
                this.get('searchResults').pushObject(restoredUser._internalModel);
                this.get('newlyAdded').removeObject(restoredUser);
            }
        },
        updatePermissions(contributor, permission) {
            this.set(`permissionChanges.${contributor.id}`, permission.toLowerCase());
            this.sendAction(
                'editContributors',
                this.get('contributors'),
                this.get('permissionChanges'),
                {}
            );
            this.set('permissionChanges', {});
            this.toggleProperty('permissionToggle');
            this.toggleProperty('removalToggle');
            this.removedSelfAsAdmin(contributor, permission);

        },
        updateBibliographic(contributor, isBibliographic) {
            this.set(`bibliographicChanges.${contributor.id}`, isBibliographic);
            this.sendAction(
                'editContributors',
                this.get('contributors'),
                {},
                this.get('bibliographicChanges')
            );
            this.set('bibliographicChanges', {});
            this.toggleProperty('bibliographicToggle');
            this.toggleProperty('removalToggle');
        }
    },
    /**
    * If user removes their own admin permissions, many things on the page must become
    * disabled.  Changing the stillAdmin flag to false will remove many of the options
    * on the page.
    */
    removedSelfAsAdmin(contributor, permission) {
        if (this.get('currentUser').id === contributor.id.split('-')[1] && permission !== 'ADMIN') {
            this.set('stillAdmin', false);
        }
    }
});
