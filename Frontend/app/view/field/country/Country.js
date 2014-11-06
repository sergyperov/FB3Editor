/**
 * Список стран.
 *
 * @author dew1983@mail.ru <Suvorov Andrey M.>
 */

Ext.define(
	'FBEditor.view.field.country.Country',
	{
		extend: 'Ext.form.field.ComboBox',
		requires: [
			'FBEditor.view.field.country.CountryStore'
		],
		xtype: 'countryfield',
		queryMode: 'local',
		displayField: 'name',
		valueField: 'value',
		editable: false,

		initComponent: function ()
		{
			var me = this,
				store;

			store = Ext.create('FBEditor.view.field.country.CountryStore');
			me.store = store;
			me.callParent(arguments);
		}
	}
);