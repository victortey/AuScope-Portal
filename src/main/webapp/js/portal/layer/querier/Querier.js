/**
 * An abstract class for providing functionality that
 * looks for more information about a particular QueryTarget.
 *
 * Ie if the user selects a particular feature from a WFS for
 * more information, the querier will lookup that information
 * an return a portal.layer.querier.BaseComponent contain
 * said information
 *
 */
Ext.define('portal.layer.querier.Querier', {
    extend: 'Ext.util.Observable',

    config : {
        rootCfg : {} //the root configuration object to apply to all generated portal.layer.querier.BaseComponent
    },

    constructor: function(config){

        // Copy configured listeners into *this* object so that the base class's
        // constructor will add them.
        this.listeners = config.listeners;
        this.rootCfg = config.rootCfg ? config.rootCfg : {};

        // Call our superclass constructor to complete construction process.
        this.callParent(arguments)
    },

    /**
     * An abstract function for querying for information
     * about a particular feature/location associated with a
     * data source.
     *
     * The result of the query will be returned via a callback mechanism
     * as a set of BaseComponent's ie. GUI widgets. All GUI widgets returned
     * this way should have had their configuration derived from this
     * instances rootCfg object. This allows users of this class to set
     * preferred sizes and styles.
     *
     * function(portal.layer.querier.QueryTarget target
     *          function(portal.layer.querier.Querier this, portal.layer.querier.BaseComponent[] baseComponents, portal.layer.querier.QueryTarget target) callback
     *
     * returns - void
     *
     * target - the instance that fired off the query
     * callback - will be called the specified parameters after the BaseComponent has been created. The baseComponents array may be null or empty
     */
    query : portal.util.UnimplementedFunction

});