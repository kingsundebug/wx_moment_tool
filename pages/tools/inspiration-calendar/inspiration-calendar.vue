<template>
	<view class="page">
		<view class="today-card" v-if="todayInfo">
			<view class="today-card__head">
				<text class="today-card__label">今日灵感</text>
				<text class="today-card__date">{{ todayLabel }}</text>
			</view>
			<view v-if="todayInfo.holiday || todayInfo.solarTerm" class="today-tags">
				<text v-if="todayInfo.holiday" class="tag tag--holiday">{{ todayInfo.holiday.name }}</text>
				<text v-if="todayInfo.solarTerm" class="tag tag--solar">{{ todayInfo.solarTerm.name }}</text>
			</view>
			<text v-if="!todayInfo.inspirations.length" class="today-empty">暂无专属灵感，看看日历其他日子吧</text>
		</view>

		<view class="calendar-panel">
			<view class="calendar-nav">
				<view class="nav-btn" hover-class="nav-btn--hover" @tap="prevMonth">
					<text class="nav-btn__icon">‹</text>
				</view>
				<text class="calendar-title">{{ year }}年{{ month }}月</text>
				<view class="nav-btn" hover-class="nav-btn--hover" @tap="nextMonth">
					<text class="nav-btn__icon">›</text>
				</view>
			</view>

			<view class="weekdays">
				<text v-for="label in weekdayLabels" :key="label" class="weekday">{{ label }}</text>
			</view>

			<view class="days-grid">
				<view
					v-for="(cell, idx) in monthCells"
					:key="idx"
					class="day-cell"
					:class="{
						'day-cell--empty': !cell.isCurrentMonth,
						'day-cell--today': cell.dateKey === todayKey,
						'day-cell--selected': cell.dateKey === selectedKey
					}"
					@tap="selectDay(cell)"
				>
					<text v-if="cell.day" class="day-num">{{ cell.day }}</text>
					<view v-if="cell.dateKey && hasMark(cell.dateKey)" class="day-dot" />
				</view>
			</view>
		</view>

		<view v-if="selectedInfo" class="detail-panel">
			<text class="detail-title">{{ selectedDateLabel }}</text>

			<view v-if="selectedInfo.holiday || selectedInfo.solarTerm" class="event-row">
				<text v-if="selectedInfo.holiday" class="tag tag--holiday">{{ selectedInfo.holiday.name }}</text>
				<text v-if="selectedInfo.solarTerm" class="tag tag--solar">{{ selectedInfo.solarTerm.name }}</text>
			</view>

			<view v-if="!selectedInfo.inspirations.length" class="empty-tip">
				<text>这一天还没有灵感推荐</text>
			</view>

			<view
				v-for="(item, i) in selectedInfo.inspirations"
				:key="i"
				class="inspiration-card"
			>
				<text class="inspiration-card__title">{{ item.title }}</text>
				<text class="inspiration-card__text">{{ item.text }}</text>
				<view class="inspiration-card__actions">
					<button
						class="btn-action btn-action--primary"
						size="mini"
						hover-class="btn-action--hover"
						@tap="goAi(item)"
					>
						AI 写文案
					</button>
					<button
						class="btn-action btn-action--outline"
						size="mini"
						hover-class="btn-action--hover"
						@tap="goLibrary(item)"
					>
						文案库
					</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import {
	formatDateKey,
	getMonthDays,
	getWeekdayLabels,
	getDayInfo,
	getTodayInfo,
	hasEventMark
} from '@/utils/inspiration-calendar.js'

export default {
	data() {
		const today = new Date()
		return {
			year: today.getFullYear(),
			month: today.getMonth() + 1,
			todayKey: formatDateKey(today),
			selectedKey: formatDateKey(today),
			weekdayLabels: getWeekdayLabels(),
			todayInfo: null,
			selectedInfo: null,
			monthCells: []
		}
	},
	computed: {
		todayLabel() {
			const d = new Date()
			return `${d.getMonth() + 1}月${d.getDate()}日 周${this.weekdayLabels[d.getDay()]}`
		},
		selectedDateLabel() {
			if (!this.selectedKey) return ''
			const [y, m, day] = this.selectedKey.split('-').map(Number)
			const d = new Date(y, m - 1, day)
			return `${m}月${day}日 周${this.weekdayLabels[d.getDay()]}`
		}
	},
	onLoad() {
		this.refresh()
	},
	methods: {
		hasMark(dateKey) {
			return hasEventMark(dateKey)
		},
		refresh() {
			this.todayInfo = getTodayInfo()
			this.monthCells = getMonthDays(this.year, this.month)
			this.selectedInfo = getDayInfo(this.selectedKey)
		},
		selectDay(cell) {
			if (!cell.isCurrentMonth || !cell.dateKey) return
			this.selectedKey = cell.dateKey
			this.selectedInfo = getDayInfo(cell.dateKey)
		},
		prevMonth() {
			if (this.month === 1) {
				this.year -= 1
				this.month = 12
			} else {
				this.month -= 1
			}
			this.monthCells = getMonthDays(this.year, this.month)
		},
		nextMonth() {
			if (this.month === 12) {
				this.year += 1
				this.month = 1
			} else {
				this.month += 1
			}
			this.monthCells = getMonthDays(this.year, this.month)
		},
		goAi(item) {
			const theme = encodeURIComponent(item.theme || item.title || '')
			uni.navigateTo({ url: `/pages/copywriting/ai?theme=${theme}` })
		},
		goLibrary(item) {
			const category = item.category ? `?category=${encodeURIComponent(item.category)}` : ''
			uni.navigateTo({ url: `/pages/copywriting/library${category}` })
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	padding: 24rpx 24rpx 48rpx;
	box-sizing: border-box;
	background-color: #f5f6f8;
}

.today-card {
	background: linear-gradient(135deg, #07c160 0%, #05a650 100%);
	border-radius: 20rpx;
	padding: 28rpx 32rpx;
	margin-bottom: 24rpx;
	color: #fff;
	box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.25);
}

.today-card__head {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.today-card__label {
	font-size: 32rpx;
	font-weight: 600;
}

.today-card__date {
	font-size: 24rpx;
	opacity: 0.9;
}

.today-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.today-empty {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	opacity: 0.85;
}

.calendar-panel {
	background: #fff;
	border-radius: 20rpx;
	padding: 24rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.calendar-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.calendar-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.nav-btn {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: #f5f6f8;
}

.nav-btn--hover {
	opacity: 0.7;
}

.nav-btn__icon {
	font-size: 40rpx;
	color: #666;
	line-height: 1;
}

.weekdays {
	display: flex;
	margin-bottom: 8rpx;
}

.weekday {
	flex: 1;
	text-align: center;
	font-size: 24rpx;
	color: #999;
}

.days-grid {
	display: flex;
	flex-wrap: wrap;
}

.day-cell {
	width: 14.2857%;
	height: 88rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	border-radius: 12rpx;
}

.day-cell--empty {
	pointer-events: none;
}

.day-cell--today .day-num {
	background: #07c160;
	color: #fff;
	border-radius: 50%;
	width: 56rpx;
	height: 56rpx;
	line-height: 56rpx;
	text-align: center;
}

.day-cell--selected:not(.day-cell--today) {
	background: #e8f8ef;
}

.day-num {
	font-size: 28rpx;
	color: #333;
	width: 56rpx;
	height: 56rpx;
	line-height: 56rpx;
	text-align: center;
}

.day-dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	background: #07c160;
	margin-top: 2rpx;
}

.detail-panel {
	margin-top: 24rpx;
	background: #fff;
	border-radius: 20rpx;
	padding: 28rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.detail-title {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 16rpx;
}

.event-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 20rpx;
}

.tag {
	display: inline-block;
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	font-size: 24rpx;
}

.tag--holiday {
	background: #fff1f0;
	color: #cf1322;
}

.tag--solar {
	background: #e6f7ff;
	color: #096dd9;
}

.empty-tip {
	text-align: center;
	color: #999;
	font-size: 26rpx;
	padding: 32rpx 0;
}

.inspiration-card {
	background: #f5f6f8;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.inspiration-card:last-child {
	margin-bottom: 0;
}

.inspiration-card__title {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 8rpx;
}

.inspiration-card__text {
	display: block;
	font-size: 26rpx;
	color: #666;
	line-height: 40rpx;
}

.inspiration-card__actions {
	display: flex;
	gap: 16rpx;
	margin-top: 20rpx;
}

.btn-action {
	margin: 0;
	padding: 0 28rpx;
	height: 60rpx;
	line-height: 60rpx;
	font-size: 24rpx;
	border-radius: 30rpx;
}

.btn-action::after {
	border: none;
}

.btn-action--primary {
	background: #07c160;
	color: #fff;
}

.btn-action--outline {
	background: #fff;
	color: #07c160;
	border: 2rpx solid #07c160;
}

.btn-action--hover {
	opacity: 0.85;
}
</style>
