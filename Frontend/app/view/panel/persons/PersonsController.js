/**
 * Контроллер панели отображения данных персон.
 *
 * @author dew1983@mail.ru <Suvorov Andrey M.>
 */

Ext.define(
	'FBEditor.view.panel.persons.PersonsController',
	{
		extend: 'Ext.app.ViewController',
		alias: 'controller.panel.persons',

		/**
		 * Загружает данные в панель.
		 * @param {Object} data Данные для запроса.
		 */
		onLoadData: function (data)
		{
			var me = this,
				view = me.getView(),
				store = view.store;

			if (data)
			{
				// показываем индикатор загрузки
				view.setLoading(view.loadMask);

				store.setParams(data);
				store.load();
			}
		}
	}
);