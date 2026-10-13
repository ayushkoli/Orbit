import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { OrbitTodayWidget, type WidgetData } from '@/widget/OrbitWidget';
import { getWidgetData, toggleHabitForWidget, toggleTaskForWidget } from '@/widget/data';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget, clickAction, clickActionData } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await getWidgetData();
      renderWidget(<OrbitTodayWidget data={data} />);
      break;
    }

    case 'WIDGET_CLICK': {
      if (clickAction === 'TOGGLE_HABIT' && clickActionData?.habitId) {
        await toggleHabitForWidget(clickActionData.habitId as string);
        const data = await getWidgetData();
        renderWidget(<OrbitTodayWidget data={data} />);
      } else if (clickAction === 'TOGGLE_TASK' && clickActionData?.taskId) {
        await toggleTaskForWidget(clickActionData.taskId as string);
        const data = await getWidgetData();
        renderWidget(<OrbitTodayWidget data={data} />);
      }
      // OPEN_APP is handled automatically by the library (opens the app)
      break;
    }

    case 'WIDGET_DELETED':
      break;
  }
}
