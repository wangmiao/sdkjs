/*
 * (c) Copyright Ascensio System SIA 2010-2019
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";
/**
 * User: Ilja.Kirillov
 * Date: 11.05.2017
 * Time: 16:48
 */

/**
 * @constructor
 * @extends {CParagraphContentWithParagraphLikeContent}
 */
function CInlineLevelSdt()
{
	this.Id = AscCommon.g_oIdCounter.Get_NewId();

	CParagraphContentWithParagraphLikeContent.call(this);

	this.Pr   = new CSdtPr();
	this.Type = para_InlineLevelSdt;

	this.BoundsPaths          = null;
	this.BoundsPathsStartPage = -1;

	this.PlaceHolder = new ParaRun();
	this.PlaceHolder.AddText(AscCommon.translateManager.getValue('Your text here'));
	this.PlaceHolder.PlaceHolder = true;
	this.AddToContent(0, this.PlaceHolder);

	// Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
	g_oTableId.Add(this, this.Id);
}

CInlineLevelSdt.prototype = Object.create(CParagraphContentWithParagraphLikeContent.prototype);
CInlineLevelSdt.prototype.constructor = CInlineLevelSdt;


CInlineLevelSdt.prototype.Get_Id = function()
{
	return this.Id;
};
CInlineLevelSdt.prototype.GetId = function()
{
	return this.Get_Id();
};
CInlineLevelSdt.prototype.Add = function(Item)
{
	this.private_ReplacePlaceHolderWithContent();
	CParagraphContentWithParagraphLikeContent.prototype.Add.apply(this, arguments);
};
CInlineLevelSdt.prototype.Copy = function(isUseSelection, oPr)
{
	var oContentControl = new CInlineLevelSdt();

	oContentControl.ReplacePlaceHolderWithContent();

	var nStartPos = 0;
	var nEndPos   = this.Content.length - 1;

	if (isUseSelection && this.State.Selection.Use)
	{
		nStartPos = this.State.Selection.StartPos;
		nEndPos   = this.State.Selection.EndPos;

		if (nStartPos > nEndPos)
		{
			nStartPos = this.State.Selection.EndPos;
			nEndPos   = this.State.Selection.StartPos;
		}
	}

	if (!this.IsPlaceHolder())
	{
		for (var nCurPos = nStartPos; nCurPos <= nEndPos; ++nCurPos)
		{
			var oItem = this.Content[nCurPos];

			if (nStartPos === nEndPos || nEndPos === nCurPos)
				oContentControl.AddToContent(nCurPos - nStartPos, oItem.Copy(isUseSelection, oPr));
			else
				oContentControl.AddToContent(nCurPos - nStartPos, oItem.Copy(false, oPr));
		}
	}

	if (oContentControl.IsEmpty())
		oContentControl.ReplaceContentWithPlaceHolder();

	oContentControl.SetLabel(this.GetLabel());
	oContentControl.SetTag(this.GetTag());
	oContentControl.SetAlias(this.GetAlias());
	oContentControl.SetContentControlLock(this.GetContentControlLock());
	oContentControl.SetAppearance(this.GetAppearance());
	oContentControl.SetColor(this.GetColor());

	return oContentControl;
};
CInlineLevelSdt.prototype.GetSelectedElementsInfo = function(Info)
{
	Info.SetInlineLevelSdt(this);
	CParagraphContentWithParagraphLikeContent.prototype.GetSelectedElementsInfo.apply(this, arguments);
};
CInlineLevelSdt.prototype.Add_ToContent = function(Pos, Item, UpdatePosition)
{
	History.Add(new CChangesParaFieldAddItem(this, Pos, [Item]));
	CParagraphContentWithParagraphLikeContent.prototype.Add_ToContent.apply(this, arguments);
};
CInlineLevelSdt.prototype.Remove_FromContent = function(Pos, Count, UpdatePosition)
{
	// Получим массив удаляемых элементов
	var DeletedItems = this.Content.slice(Pos, Pos + Count);
	History.Add(new CChangesParaFieldRemoveItem(this, Pos, DeletedItems));

	CParagraphContentWithParagraphLikeContent.prototype.Remove_FromContent.apply(this, arguments);
};
CInlineLevelSdt.prototype.Split = function (ContentPos, Depth)
{
	// Не даем разделять
	return null;
};
CInlineLevelSdt.prototype.CanSplit = function()
{
	return false;
};
CInlineLevelSdt.prototype.Recalculate_Range_Spaces = function(PRSA, _CurLine, _CurRange, _CurPage)
{
	var CurLine  = _CurLine - this.StartLine;
	var CurRange = (0 === _CurLine ? _CurRange - this.StartRange : _CurRange);

	if (0 === CurLine && 0 === CurRange && true !== PRSA.RecalcFast)
		this.Bounds = {};

	var oParagraph = PRSA.Paragraph;
	var Y0         = oParagraph.Lines[_CurLine].Top + oParagraph.Pages[_CurPage].Y;
	var Y1         = oParagraph.Lines[_CurLine].Bottom + oParagraph.Pages[_CurPage].Y;
	var X0         = PRSA.X;

	CParagraphContentWithParagraphLikeContent.prototype.Recalculate_Range_Spaces.apply(this, arguments);

	var X1 = PRSA.X;

	this.Bounds[((CurLine << 16) & 0xFFFF0000) | (CurRange & 0x0000FFFF)] = {
		X            : X0,
		W            : X1 - X0,
		Y            : Y0,
		H            : Y1 - Y0,
		Page         : PRSA.Paragraph.Get_AbsolutePage(_CurPage),
		PageInternal : _CurPage
	};

	this.BoundsPaths = null;
};
CInlineLevelSdt.prototype.Draw_HighLights = function(PDSH)
{
	PDSH.AddInlineSdt(this);
	CParagraphContentWithParagraphLikeContent.prototype.Draw_HighLights.apply(this, arguments);
};
CInlineLevelSdt.prototype.GetRangeBounds = function(_CurLine, _CurRange)
{
	var CurLine  = _CurLine - this.StartLine;
	var CurRange = (0 === _CurLine ? _CurRange - this.StartRange : _CurRange);

	return this.Bounds[((CurLine << 16) & 0xFFFF0000) | (CurRange & 0x0000FFFF)];
};
CInlineLevelSdt.prototype.Get_LeftPos = function(SearchPos, ContentPos, Depth, UseContentPos)
{
	if (false === UseContentPos && this.Content.length > 0)
	{
		// При переходе в новый контент встаем в его конец
		var CurPos = this.Content.length - 1;
		this.Content[CurPos].Get_EndPos(false, SearchPos.Pos, Depth + 1);
		SearchPos.Pos.Update(CurPos, Depth);
		SearchPos.Found = true;
		return true;
	}

	var bResult = CParagraphContentWithParagraphLikeContent.prototype.Get_LeftPos.call(this, SearchPos, ContentPos, Depth, UseContentPos);

	if (true !== bResult && this.Paragraph && this.Paragraph.LogicDocument && true === this.Paragraph.LogicDocument.IsFillingFormMode())
	{
		this.Get_StartPos(SearchPos.Pos, Depth);
		SearchPos.Found = true;
		return true;
	}

	return bResult;
};
CInlineLevelSdt.prototype.Get_RightPos = function(SearchPos, ContentPos, Depth, UseContentPos, StepEnd)
{
	if (false === UseContentPos && this.Content.length > 0)
	{
		// При переходе в новый контент встаем в его начало
		this.Content[0].Get_StartPos(SearchPos.Pos, Depth + 1);
		SearchPos.Pos.Update(0, Depth);
		SearchPos.Found = true;
		return true;
	}

	var bResult = CParagraphContentWithParagraphLikeContent.prototype.Get_RightPos.call(this, SearchPos, ContentPos, Depth, UseContentPos, StepEnd);

	if (true !== bResult && this.Paragraph && this.Paragraph.LogicDocument && true === this.Paragraph.LogicDocument.IsFillingFormMode())
	{
		this.Get_EndPos(false, SearchPos.Pos, Depth);
		SearchPos.Found = true;
		return true;
	}

	return bResult;
};
CInlineLevelSdt.prototype.Remove = function(nDirection, bOnAddText)
{
	if (this.IsPlaceHolder())
	{
		this.private_ReplacePlaceHolderWithContent();
		return;
	}

	CParagraphContentWithParagraphLikeContent.prototype.Remove.call(this, nDirection, bOnAddText);

	if (this.Is_Empty()
		&& this.Paragraph
		&& this.Paragraph.LogicDocument
		&& this.CanBeEdited()
		&& ((!bOnAddText
		&& true === this.Paragraph.LogicDocument.IsFillingFormMode())
		|| (this === this.Paragraph.LogicDocument.CheckInlineSdtOnDelete)))
	{
		this.private_ReplaceContentWithPlaceHolder();
	}
};
CInlineLevelSdt.prototype.Shift_Range = function(Dx, Dy, _CurLine, _CurRange)
{
	CParagraphContentWithParagraphLikeContent.prototype.Shift_Range.call(this, Dx, Dy, _CurLine, _CurRange);

	var CurLine = _CurLine - this.StartLine;
	var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

	var oRangeBounds = this.Bounds[((CurLine << 16) & 0xFFFF0000) | (CurRange & 0x0000FFFF)];
	if (oRangeBounds)
	{
		oRangeBounds.X += Dx;
		oRangeBounds.Y += Dy;
	}

	if (this.BoundsPaths)
		this.BoundsPaths = null;
};
CInlineLevelSdt.prototype.Get_WordStartPos = function(SearchPos, ContentPos, Depth, UseContentPos)
{
	CParagraphContentWithParagraphLikeContent.prototype.Get_WordStartPos.call(this, SearchPos, ContentPos, Depth, UseContentPos);

	if (true !== SearchPos.Found && this.Paragraph && this.Paragraph.LogicDocument && true === this.Paragraph.LogicDocument.IsFillingFormMode())
	{
		this.Get_StartPos(SearchPos.Pos, Depth);
		SearchPos.UpdatePos = true;
		SearchPos.Found     = true;

	}
};
CInlineLevelSdt.prototype.Get_WordEndPos = function(SearchPos, ContentPos, Depth, UseContentPos, StepEnd)
{
	CParagraphContentWithParagraphLikeContent.prototype.Get_WordEndPos.call(this, SearchPos, ContentPos, Depth, UseContentPos, StepEnd);

	if (true !== SearchPos.Found && this.Paragraph && this.Paragraph.LogicDocument && true === this.Paragraph.LogicDocument.IsFillingFormMode())
	{
		this.Get_EndPos(false, SearchPos.Pos, Depth);
		SearchPos.UpdatePos = true;
		SearchPos.Found     = true;

	}
};
CInlineLevelSdt.prototype.GetBoundingPolygon = function()
{
	var StartPage = this.Paragraph.Get_StartPage_Absolute();
	if (null === this.BoundsPaths || StartPage !== this.BoundsPathsStartPage)
	{
		var arrBounds = [], arrRects = [], CurPage = -1;
		for (var Key in this.Bounds)
		{
			if (CurPage !== this.Bounds[Key].PageInternal)
			{
				arrRects = [];
				arrBounds.push(arrRects);
				CurPage  = this.Bounds[Key].PageInternal;
			}
			this.Bounds[Key].Page = this.Paragraph.Get_AbsolutePage(this.Bounds[Key].PageInternal);
			arrRects.push(this.Bounds[Key]);
		}

		this.BoundsPaths = [];
		for (var nIndex = 0, nCount = arrBounds.length; nIndex < nCount; ++nIndex)
		{
			var oPolygon = new CPolygon();
			oPolygon.fill([arrBounds[nIndex]]);
			this.BoundsPaths = this.BoundsPaths.concat(oPolygon.GetPaths(0));
		}

		this.BoundsPathsStartPage = StartPage;
	}

	return this.BoundsPaths;
};
CInlineLevelSdt.prototype.DrawContentControlsTrack = function(isHover)
{
	if (!this.Paragraph && this.Paragraph.LogicDocument)
		return;

	var oDrawingDocument = this.Paragraph.LogicDocument.GetDrawingDocument();

	if (Asc.c_oAscSdtAppearance.Hidden === this.GetAppearance() || this.Paragraph.LogicDocument.IsForceHideContentControlTrack())
	{
		oDrawingDocument.OnDrawContentControl(null, isHover ? c_oContentControlTrack.Hover : c_oContentControlTrack.In);
		return;
	}

	var sName      = this.GetAlias();
	var isBuiltIn  = false;
	var arrButtons = [];

	oDrawingDocument.OnDrawContentControl(this.GetId(), isHover ? c_oContentControlTrack.Hover : c_oContentControlTrack.In, this.GetBoundingPolygon(), this.Paragraph.Get_ParentTextTransform(), sName, isBuiltIn, arrButtons, this.GetColor());
};
CInlineLevelSdt.prototype.SelectContentControl = function()
{
	this.SelectThisElement(1);
};
CInlineLevelSdt.prototype.MoveCursorToContentControl = function(isBegin)
{
	this.RemoveSelection();
	this.SetThisElementCurrent();

	if (isBegin)
		this.MoveCursorToStartPos();
	else
		this.MoveCursorToEndPos();
};
CInlineLevelSdt.prototype.RemoveContentControlWrapper = function()
{
	var oParent = this.Get_Parent();
	if (!oParent)
		return;

	var nElementPos = this.Get_PosInParent(oParent);
	if (-1 === nElementPos)
		return;

	var nParentCurPos            = oParent instanceof Paragraph ? oParent.CurPos.ContentPos : oParent.State.ContentPos;
	var nParentSelectionStartPos = oParent.Selection.StartPos;
	var nParentSelectionEndPos   = oParent.Selection.EndPos;

	var nCount = this.Content.length;
	oParent.Remove_FromContent(nElementPos, 1);
	for (var nIndex = 0; nIndex < nCount; ++nIndex)
	{
		oParent.Add_ToContent(nElementPos + nIndex, this.Content[nIndex]);
	}

	if (nParentCurPos === nElementPos)
	{
		if (oParent instanceof Paragraph)
			oParent.CurPos.ContentPos = nParentCurPos + this.State.ContentPos;
		else
			oParent.State.ContentPos = nParentCurPos + this.State.ContentPos;

	}
	else if (nParentCurPos > nElementPos)
	{
		if (oParent instanceof Paragraph)
			oParent.CurPos.ContentPos = nParentCurPos + nCount - 1;
		else
			oParent.State.ContentPos = nParentCurPos + nCount - 1;
	}

	if (nParentSelectionStartPos === nElementPos)
		oParent.Selection.StartPos = nParentSelectionStartPos + this.Selection.StartPos;
	else if (nParentSelectionStartPos > nElementPos)
		oParent.Selection.StartPos = nParentSelectionStartPos + nCount - 1;

	if (nParentSelectionEndPos === nElementPos)
		oParent.Selection.EndPos = nParentSelectionEndPos + this.Selection.EndPos;
	else if (nParentSelectionEndPos > nElementPos)
		oParent.Selection.EndPos = nParentSelectionEndPos + nCount - 1;

	this.Remove_FromContent(0, this.Content.length);
};
CInlineLevelSdt.prototype.FindNextFillingForm = function(isNext, isCurrent, isStart)
{
	if (isCurrent && true === this.IsSelectedAll())
	{
		if (isNext)
			return CParagraphContentWithParagraphLikeContent.prototype.FindNextFillingForm.apply(this, arguments);

		return null;
	}

	if (!isCurrent && isNext)
		return this;

	var oRes = CParagraphContentWithParagraphLikeContent.prototype.FindNextFillingForm.apply(this, arguments);
	if (!oRes && !isNext)
		return this;

	return null;
};
CInlineLevelSdt.prototype.GetAllContentControls = function(arrContentControls)
{
	arrContentControls.push(this);
	CParagraphContentWithParagraphLikeContent.prototype.GetAllContentControls.apply(this, arguments);
};
CInlineLevelSdt.prototype.Document_UpdateInterfaceState = function()
{
	if (this.Paragraph && this.Paragraph.LogicDocument)
		this.Paragraph.LogicDocument.Api.sync_ContentControlCallback(this.GetContentControlPr());

	CParagraphContentWithParagraphLikeContent.prototype.Document_UpdateInterfaceState.apply(this, arguments);
};
CInlineLevelSdt.prototype.SetParagraph = function(oParagraph)
{
	this.PlaceHolder.SetParagraph(oParagraph);
	CParagraphContentWithParagraphLikeContent.prototype.SetParagraph.apply(this, arguments);
};
/**
 * Активен PlaceHolder сейчас или нет
 * @returns {boolean}
 */
CInlineLevelSdt.prototype.IsPlaceHolder = function()
{
	return (this.Content.length === 1 && this.Content[0] === this.PlaceHolder);
};
CInlineLevelSdt.prototype.private_ReplacePlaceHolderWithContent = function(bMathRun)
{
	if (!this.IsPlaceHolder())
		return;

	this.RemoveSelection();
	this.MoveCursorToStartPos();
	var oTextPr = this.GetDirectTextPr();

	this.RemoveFromContent(0, this.GetElementsCount());

	var oRun = new ParaRun(undefined, bMathRun);
	if (oTextPr)
		oRun.SetPr(oTextPr.Copy());

	this.AddToContent(0, oRun);
	this.RemoveSelection();
	this.MoveCursorToStartPos();
};
CInlineLevelSdt.prototype.private_ReplaceContentWithPlaceHolder = function()
{
	if (this.IsPlaceHolder())
		return;

	this.RemoveFromContent(0, this.GetElementsCount());
	this.AddToContent(0, this.PlaceHolder);
	this.SelectContentControl();
};
CInlineLevelSdt.prototype.Set_SelectionContentPos = function(StartContentPos, EndContentPos, Depth, StartFlag, EndFlag)
{
	if (this.IsPlaceHolder())
	{
		if (this.Paragraph && this.Paragraph.GetSelectDirection() > 0)
			this.SelectAll(1);
		else
			this.SelectAll(-1);
	}
	else
	{
		CParagraphContentWithParagraphLikeContent.prototype.Set_SelectionContentPos.apply(this, arguments);
	}
};
CInlineLevelSdt.prototype.ReplacePlaceHolderWithContent = function(bMathRun)
{
	this.private_ReplacePlaceHolderWithContent(bMathRun);
};
CInlineLevelSdt.prototype.ReplaceContentWithPlaceHolder = function()
{
	this.private_ReplaceContentWithPlaceHolder();
};
//----------------------------------------------------------------------------------------------------------------------
// Выставление настроек
//----------------------------------------------------------------------------------------------------------------------
CInlineLevelSdt.prototype.GetContentControlType = function()
{
	return c_oAscSdtLevelType.Inline;
};
CInlineLevelSdt.prototype.SetPr = function(oPr)
{
	this.SetAlias(oPr.Alias);
	this.SetTag(oPr.Tag);
	this.SetLabel(oPr.Label);
	this.SetContentControlLock(oPr.Lock);
	this.SetContentControlId(oPr.Id);

	if (undefined !== oPr.Appearance)
		this.SetAppearance(oPr.Appearance);

	if (undefined !== oPr.Color)
		this.SetColor(oPr.Color);
};
CInlineLevelSdt.prototype.SetAlias = function(sAlias)
{
	if (sAlias !== this.Pr.Alias)
	{
		History.Add(new CChangesSdtPrAlias(this, this.Pr.Alias, sAlias));
		this.Pr.Alias = sAlias;
	}
};
CInlineLevelSdt.prototype.GetAlias = function()
{
	return (undefined !== this.Pr.Alias ? this.Pr.Alias : "");
};
CInlineLevelSdt.prototype.SetAppearance = function(nType)
{
	if (this.Pr.Appearance !== nType)
	{
		History.Add(new CChangesSdtPrAppearance(this, this.Pr.Appearance, nType));
		this.Pr.Appearance = nType;
	}
};
CInlineLevelSdt.prototype.GetAppearance = function()
{
	return this.Pr.Appearance;
};
CInlineLevelSdt.prototype.SetColor = function(oColor)
{
	if (null === oColor || undefined === oColor)
	{
		if (undefined !== this.Pr.Color)
		{
			History.Add(new CChangesSdtPrColor(this, this.Pr.Color, undefined));
			this.Pr.Color = undefined;
		}
	}
	else
	{
		History.Add(new CChangesSdtPrColor(this, this.Pr.Color, oColor));
		this.Pr.Color = oColor;
	}
};
CInlineLevelSdt.prototype.GetColor = function()
{
	return this.Pr.Color;
};
CInlineLevelSdt.prototype.SetContentControlId = function(Id)
{
	if (this.Pr.Id !== Id)
	{
		History.Add(new CChangesSdtPrId(this, this.Pr.Id, Id));
		this.Pr.Id = Id;
	}
};
CInlineLevelSdt.prototype.GetContentControlId = function()
{
	return this.Pr.Id;
};
CInlineLevelSdt.prototype.SetTag = function(sTag)
{
	if (this.Pr.Tag !== sTag)
	{
		History.Add(new CChangesSdtPrTag(this, this.Pr.Tag, sTag));
		this.Pr.Tag = sTag;
	}
};
CInlineLevelSdt.prototype.GetTag = function()
{
	return (undefined !== this.Pr.Tag ? this.Pr.Tag : "");
};
CInlineLevelSdt.prototype.SetLabel = function(sLabel)
{
	if (this.Pr.Label !== sLabel)
	{
		History.Add(new CChangesSdtPrLabel(this, this.Pr.Label, sLabel));
		this.Pr.Label = sLabel;
	}
};
CInlineLevelSdt.prototype.GetLabel = function()
{
	return (undefined !== this.Pr.Label ? this.Pr.Label : "");
};
CInlineLevelSdt.prototype.SetContentControlLock = function(nLockType)
{
	if (this.Pr.Lock !== nLockType)
	{
		History.Add(new CChangesSdtPrLock(this, this.Pr.Lock, nLockType));
		this.Pr.Lock = nLockType;
	}
};
CInlineLevelSdt.prototype.GetContentControlLock = function()
{
	return (undefined !== this.Pr.Lock ? this.Pr.Lock : c_oAscSdtLockType.Unlocked);
};
CInlineLevelSdt.prototype.SetContentControlPr = function(oPr)
{
	if (!oPr)
		return;

	if (undefined !== oPr.Tag)
		this.SetTag(oPr.Tag);

	if (undefined !== oPr.Id)
		this.SetContentControlId(oPr.Id);

	if (undefined !== oPr.Lock)
		this.SetContentControlLock(oPr.Lock);

	if (undefined !== oPr.Alias)
		this.SetAlias(oPr.Alias);

	if (undefined !== oPr.Appearance)
		this.SetAppearance(oPr.Appearance);

	if (undefined !== oPr.Color)
		this.SetColor(oPr.Color);
};
CInlineLevelSdt.prototype.GetContentControlPr = function()
{
	var oPr = new CContentControlPr(c_oAscSdtLevelType.Inline);

	oPr.Tag        = this.GetTag();
	oPr.Id         = this.Pr.Id;
	oPr.Lock       = this.Pr.Lock;
	oPr.InternalId = this.GetId();
	oPr.Alias      = this.GetAlias();
	oPr.Appearance = this.GetAppearance();
	oPr.Color      = this.GetColor();

	return oPr;
};
/**
 * Можно ли удалить данный контейнер
 * @returns {boolean}
 */
CInlineLevelSdt.prototype.CanBeDeleted = function()
{
	return (undefined === this.Pr.Lock || c_oAscSdtLockType.Unlocked === this.Pr.Lock || c_oAscSdtLockType.ContentLocked === this.Pr.Lock);
};
/**
 * Можно ли редактировать данный контейнер
 * @returns {boolean}
 */
CInlineLevelSdt.prototype.CanBeEdited = function()
{
	return (undefined === this.Pr.Lock || c_oAscSdtLockType.Unlocked === this.Pr.Lock || c_oAscSdtLockType.SdtLocked === this.Pr.Lock);
};

//----------------------------------------------------------------------------------------------------------------------
// Функции совместного редактирования
//----------------------------------------------------------------------------------------------------------------------
CInlineLevelSdt.prototype.Write_ToBinary2 = function(Writer)
{
	Writer.WriteLong(AscDFH.historyitem_type_InlineLevelSdt);

	// String : Id
	// Long   : Количество элементов
	// Array of Strings : массив с Id элементов
	// String : PlaceHolder Id

	Writer.WriteString2(this.Id);

	var Count = this.Content.length;
	Writer.WriteLong(Count);
	for (var Index = 0; Index < Count; Index++)
		Writer.WriteString2(this.Content[Index].Get_Id());

	Writer.WriteString2(this.PlaceHolder.GetId());
};
CInlineLevelSdt.prototype.Read_FromBinary2 = function(Reader)
{
	// String : Id
	// Long   : Количество элементов
	// Array of Strings : массив с Id элементов
	// String : PlaceHolder Id

	this.Id = Reader.GetString2();

	var Count = Reader.GetLong();
	this.Content = [];
	for (var Index = 0; Index < Count; Index++)
	{
		var Element = AscCommon.g_oTableId.Get_ById(Reader.GetString2());
		if (null !== Element)
			this.Content.push(Element);
	}

	this.PlaceHolder = AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CInlineLevelSdt.prototype.Write_ToBinary = function(Writer)
{
	// Long   : Type
	// String : Id

	Writer.WriteLong(this.Type);
	Writer.WriteString2(this.Id);
};
//----------------------------------------------------------------------------------------------------------------------
CInlineLevelSdt.prototype.IsStopCursorOnEntryExit = function()
{
	return true;
};
CInlineLevelSdt.prototype.GetSelectedContentControls = function(arrContentControls)
{
	arrContentControls.push(this);
	CParagraphContentWithParagraphLikeContent.prototype.GetSelectedContentControls.call(this, arrContentControls);
};
CInlineLevelSdt.prototype.ClearContentControl = function()
{
	this.Add_ToContent(0, new ParaRun(this.GetParagraph(), false));
	this.Remove_FromContent(1, this.Content.length - 1);
};
CInlineLevelSdt.prototype.CanAddComment = function()
{
	if (!this.CanBeDeleted() || (!this.CanBeEdited() && (!this.IsSelectedAll() || this.IsSelectedOnlyThis())))
		return false;

	return CParagraphContentWithParagraphLikeContent.prototype.CanAddComment.apply(this, arguments);
};
/**
 * Проверяем выделен ли только данный элемент
 * @returns {boolean}
 */
CInlineLevelSdt.prototype.IsSelectedOnlyThis = function()
{
	if (this.Paragraph && this.Paragraph.LogicDocument)
	{
		var oInfo = this.Paragraph.LogicDocument.GetSelectedElementsInfo();
		return (oInfo.GetInlineLevelSdt() === this);
	}

	return false;
};
//--------------------------------------------------------export--------------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CInlineLevelSdt = CInlineLevelSdt;
