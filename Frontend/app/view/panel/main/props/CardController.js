/**
 * Контроллер внутренней панели свойств.
 *
 * @author dew1983@mail.ru <Suvorov Andrey M.>
 */

Ext.define(
	'FBEditor.view.panel.main.props.CardController',
	{
		extend: 'Ext.app.ViewController',
		alias: 'controller.panel.main.props.card',

		/**
		 * Актвиврует панель свойств редактора ресурсов.
		 */
		onActivePanelResources: function ()
		{
			var me = this,
				view = me.getView();

			view.setActiveItem('panel-props-resources');
		},

		/**
		 * Актвиврует панель свойств редактора текста.
		 */
		onActivePanelBody: function ()
		{
			var me = this,
				view = me.getView();

			view.setActiveItem('panel-props-body');
		},

        /**
         * Актвиврует панель свойств редактора текста.
         */
        onActivePanelXml: function ()
        {
            var me = this,
                view = me.getView();

            view.setActiveItem('panel-props-xml');
        },

		/**
		 * Актвиврует панель свойств редактора описания книги.
		 */
		onActivePanelDesc: function ()
		{
			var me = this,
				view = me.getView();

			view.setActiveItem('panel-props-desc');
		}
	}
);