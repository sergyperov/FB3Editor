/**
 * Создает div из выделения.
 *
 * @author dew1983@mail.ru <Suvorov Andrey M.>
 */

Ext.define(
	'FBEditor.editor.command.div.CreateRangeCommand',
	{
		extend: 'FBEditor.editor.command.AbstractCreateRangeCommand',

		elementName: 'div'
	}
);