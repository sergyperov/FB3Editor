/**
 * Панель имени файла.
 *
 * @author dew1983@mail.ru <Suvorov Andrey M.>
 */

Ext.define(
	'FBEditor.view.panel.filename.FileName',
	{
		extend: 'Ext.container.Container',
		requires: [
			'FBEditor.view.panel.filename.FileNameController',
			'FBEditor.view.panel.filename.display.Display',
			'FBEditor.view.panel.filename.field.Field'
		],
		
		id: 'panel-filename',
		xtype: 'panel-filename',
		controller: 'panel.filename',
		
		listeners: {
			click: {
				element: 'el',
				fn: 'onClick'
			},
			setName: 'onSetName',
			afterrender: 'onAfterRender',
			checkPosition: 'onCheckPosition'
		},
		
		floating: true,
		autoShow: true,
		shadow: false,
		border: false,
		monitorResize: true,
		plain: true,
		x: 400,
		y: 3,
		layout: 'card',
		
		items: [
			{
				xtype: 'panel-filename-display'
			},
			{
				xtype: 'panel-filename-field'
			}
		]
	}
);